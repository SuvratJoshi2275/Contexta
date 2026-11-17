"""Inference service for SenseForge's trained NLP models."""

import json
import re
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "artifacts"

SENSES = [
    "bank.1", "bank.2",
    "interest.1", "interest.2",
    "plant.1", "plant.2",
    "point.1", "point.2",
    "right.1", "right.2",
    "table.1", "table.2",
]

NEURAL_WORDS = {s.rsplit(".", 1)[0] for s in SENSES}

LORA_DIR = ART / "wsd_v2_lora"
LID_PATH = (
    ART / "senseforge_final" / "comilingua_lid"
    / "training_v1" / "normalized_3class"
    / "comilingua_lid_3class.joblib"
)
MT_DIR = ART / "translation_v1" / "finetuned" / "best_model"

HYBRID_CONFIG = ART / "hybrid_v2" / "hybrid_config.json"


def artifact_status():
    """Check saved checkpoints without loading large models."""
    return {
        "wsd_lora": (
            (LORA_DIR / "best_lora_adapter").is_dir()
            and (LORA_DIR / "best_classifier_head.pt").is_file()
        ),
        "lid": LID_PATH.is_file(),
        "translation": MT_DIR.is_dir(),
    }


def locate_target(text, word, start=None, end=None):
    """Resolve the exact target occurrence in a sentence."""
    if start is not None or end is not None:
        if start is None or end is None:
            raise ValueError("Both target offsets are required")

        start, end = int(start), int(end)

        if not 0 <= start < end <= len(text):
            raise ValueError("Invalid target offsets")

        surface = text[start:end]
        if not surface.strip():
            raise ValueError("Target span is empty")

        return start, end

    matches = list(re.finditer(
        rf"(?<!\w){re.escape(word)}(?!\w)",
        text,
        flags=re.IGNORECASE,
    ))

    if len(matches) != 1:
        raise ValueError(
            f"Found {len(matches)} occurrences of '{word}'. "
            "Provide target offsets."
        )

    return matches[0].span()


@lru_cache(maxsize=1)
def load_lid():
    """Load the trained Comi-Lingua classifier once."""
    import joblib

    if not LID_PATH.is_file():
        raise FileNotFoundError(f"LID checkpoint missing: {LID_PATH}")

    return joblib.load(LID_PATH)


def identify_languages(text):
    """Classify whitespace-separated tokens using Comi-Lingua LID."""
    matches = list(re.finditer(r"\S+", text))

    if not matches:
        return []

    tokens = [m.group() for m in matches]
    predictions = load_lid().predict(tokens)

    return [
        {
            "token": token,
            "language": str(label),
            "start": match.start(),
            "end": match.end(),
        }
        for token, label, match in zip(
            tokens, predictions, matches
        )
    ]


def encode_target(tokenizer, text, word, start, end, max_length=64):
    """Create the same target-centered window used in LoRA evaluation."""
    import torch

    encoded = tokenizer(
        text,
        add_special_tokens=True,
        truncation=False,
        return_offsets_mapping=True,
    )

    ids = encoded["input_ids"]
    offsets = encoded["offset_mapping"]

    positions = [
        i for i, (a, b) in enumerate(offsets)
        if b > a and a < end and b > start
    ]

    if not positions:
        raise ValueError("Target-token alignment failed")

    capacity = max_length - 2
    first, last = positions[0], positions[-1]

    if last - first + 1 > capacity:
        raise ValueError("Target exceeds context window")

    left = max(1, first - capacity // 2)
    left = min(left, max(1, last - capacity + 1))
    right = min(len(ids) - 1, left + capacity)

    if right - left < capacity:
        left = max(1, right - capacity)

    selected = list(range(left, right))
    target_set = set(positions)

    input_ids = [ids[0]] + [ids[i] for i in selected] + [ids[-1]]
    target_mask = (
        [0.0]
        + [float(i in target_set) for i in selected]
        + [0.0]
    )

    attention = [1] * len(input_ids)
    pad = max_length - len(input_ids)

    if pad < 0 or not any(target_mask):
        raise ValueError("Invalid target window")

    input_ids += [tokenizer.pad_token_id] * pad
    attention += [0] * pad
    target_mask += [0.0] * pad

    allowed = [s.startswith(word + ".") for s in SENSES]

    if sum(allowed) != 2:
        raise ValueError("Unsupported neural target")

    return {
        "input_ids": torch.tensor([input_ids], dtype=torch.long),
        "attention_mask": torch.tensor([attention], dtype=torch.long),
        "target_mask": torch.tensor(
            [target_mask], dtype=torch.float32
        ),
        "class_mask": torch.tensor([allowed], dtype=torch.bool),
    }


@lru_cache(maxsize=1)
def load_wsd_lora():
    """Reconstruct the trained LoRA encoder and classifier head."""
    import torch
    import torch.nn as nn
    from transformers import AutoModel, AutoTokenizer
    from peft import PeftModel

    class TargetLoRAClassifier(nn.Module):
        def __init__(self, encoder):
            super().__init__()
            self.encoder = encoder
            hidden = encoder.config.hidden_size
            self.dropout = nn.Dropout(0.15)
            self.classifier = nn.Sequential(
                nn.Linear(hidden, 256),
                nn.GELU(),
                nn.Dropout(0.15),
                nn.Linear(256, len(SENSES)),
            )

        def forward(
            self, input_ids, attention_mask,
            target_mask, class_mask=None
        ):
            hidden = self.encoder(
                input_ids=input_ids,
                attention_mask=attention_mask,
            ).last_hidden_state

            weights = target_mask.unsqueeze(-1)
            pooled = (
                (hidden * weights).sum(dim=1)
                / weights.sum(dim=1).clamp(min=1)
            )

            logits = self.classifier(self.dropout(pooled))

            if class_mask is not None:
                logits = logits.masked_fill(
                    ~class_mask.bool(), -1e4
                )

            return logits

    tokenizer = AutoTokenizer.from_pretrained(
        "xlm-roberta-base", use_fast=True
    )

    base = AutoModel.from_pretrained(
        "xlm-roberta-base",
        attn_implementation="eager",
    )

    encoder = PeftModel.from_pretrained(
        base,
        LORA_DIR / "best_lora_adapter",
        is_trainable=False,
    )

    model = TargetLoRAClassifier(encoder)

    state = torch.load(
        LORA_DIR / "best_classifier_head.pt",
        map_location="cpu",
        weights_only=True,
    )

    model.classifier.load_state_dict(state)
    model.eval().to("cpu")

    return tokenizer, model


def predict_lora(text, word, start, end):
    """Return a lemma-restricted neural prediction and confidence."""
    import torch

    tokenizer, model = load_wsd_lora()
    batch = encode_target(tokenizer, text, word, start, end)

    with torch.inference_mode():
        logits = model(**batch)
        probs = torch.softmax(logits, dim=-1)[0]
        confidence, index = probs.max(dim=0)

    return {
        "sense_id": SENSES[index.item()],
        "confidence": float(confidence.item()),
    }


@lru_cache(maxsize=1)
def load_translation():
    """Load MarianMT only when translation is requested."""
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

    if not MT_DIR.is_dir():
        raise FileNotFoundError("Translation checkpoint missing")

    tokenizer = AutoTokenizer.from_pretrained(MT_DIR)
    model = AutoModelForSeq2SeqLM.from_pretrained(MT_DIR)
    model.eval().to("cpu")

    return tokenizer, model


def translate_en_hi(text):
    """Generate experimental English-to-Hindi translation."""
    import torch

    tokenizer, model = load_translation()

    encoded = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=96,
    )

    with torch.inference_mode():
        generated = model.generate(
            **encoded,
            max_new_tokens=96,
            num_beams=2,
        )

    return tokenizer.decode(
        generated[0],
        skip_special_tokens=True,
    )


def hybrid_predict(
    text, word, start=None, end=None,
    include_translation=False,
):
    """Combine dictionary, rules, neural WSD, LID and optional MT."""
    from .core import INVENTORY, predict as rule_predict

    if not isinstance(text, str) or not text.strip():
        raise ValueError("Sentence cannot be empty")

    word = word.strip().casefold()
    start, end = locate_target(text, word, start, end)

    warnings = []
    has_devanagari = bool(
        re.search(r"[\u0900-\u097F]", text)
    )

    if has_devanagari:
        warnings.append(
            "English WSD accuracy is not validated for "
            "Hindi or code-mixed sentences."
        )

    result = {
        "word": word,
        "text": text,
        "target_surface": text[start:end],
        "target_span": [start, end],
        "sense_id": None,
        "hindi": None,
        "definition": None,
        "confidence": None,
        "method": "unsupported",
        "status": "unsupported_word",
        "evidence": [],
        "alternatives": [],
        "token_languages": identify_languages(text),
        "translation_hi": None,
        "warnings": warnings,
    }

    if word in INVENTORY:
        normalized_text = text[:start] + word + text[end:]
        base = rule_predict(normalized_text, word, method="rule")

        result.update(base)
        result["method"] = "rule_fallback"
        result["confidence"] = None

        if word in NEURAL_WORDS:
            try:
                neural = predict_lora(text, word, start, end)

                config = json.loads(
                    HYBRID_CONFIG.read_text(encoding="utf-8")
                )
                threshold = float(config["threshold"])

                result["confidence"] = neural["confidence"]

                if neural["confidence"] >= threshold:
                    result["sense_id"] = neural["sense_id"]
                    result["method"] = "hybrid_lora"
                    result["status"] = "neural_above_threshold"
                else:
                    result["status"] = "neural_below_threshold"

            except (OSError, RuntimeError, ImportError) as exc:
                warnings.append(
                    f"Neural WSD unavailable: {type(exc).__name__}"
                )

        selected = next(
            s for s in INVENTORY[word]["senses"]
            if s["id"] == result["sense_id"]
        )

        result["hindi"] = selected["hindi"]
        result["definition"] = selected["definition"]

    if include_translation:
        if has_devanagari:
            warnings.append(
                "English-to-Hindi translation skipped for "
                "input containing Devanagari."
            )
        else:
            try:
                result["translation_hi"] = translate_en_hi(text)
            except (OSError, RuntimeError, ImportError) as exc:
                warnings.append(
                    f"Translation unavailable: {type(exc).__name__}"
                )

    return result
