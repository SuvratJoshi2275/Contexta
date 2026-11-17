import json
import xml.etree.ElementTree as ET
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "datasets/xl-wsd/training_datasets"
ART = ROOT / "artifacts"
ART.mkdir(exist_ok=True)

mapping = json.loads(
    (ROOT / "configs/babelnet_to_contexta.json").read_text(encoding="utf-8")
)

sources = ["semcor_en", "wngt_examples_en", "wngt_glosses_en"]
output = ART / "wsd_expanded_raw.jsonl"

counts = Counter()
skipped = Counter()

with output.open("w", encoding="utf-8") as out:
    for source in sources:
        folder = BASE / source
        gold = {}

        with (folder / f"{source}.gold.key.txt").open(encoding="utf-8") as f:
            for line in f:
                parts = line.split()
                if len(parts) >= 2:
                    gold[parts[0]] = parts[1:]

        for _, elem in ET.iterparse(
            folder / f"{source}.data.xml",
            events=("end",)
        ):
            if elem.tag != "sentence":
                continue

            text = ""
            targets = []

            for child in elem:
                token = (child.text or "").strip()
                if not token:
                    continue

                if text:
                    text += " "

                start = len(text)
                text += token
                end = len(text)

                if child.tag == "instance":
                    targets.append({
                        "id": child.get("id"),
                        "lemma": child.get("lemma", "").lower(),
                        "pos": child.get("pos", ""),
                        "start": start,
                        "end": end,
                        "surface": token
                    })

            for target in targets:
                original = gold.get(target["id"], [])

                if not original or any(s not in mapping for s in original):
                    skipped["unmapped"] += 1
                    continue

                mapped = {mapping[s] for s in original}

                if len(mapped) != 1:
                    skipped["conflicting"] += 1
                    continue

                sense = next(iter(mapped))
                word = sense.split(".")[0]

                if target["lemma"] != word:
                    skipped["lemma_mismatch"] += 1
                    continue

                record = {
                    "record_id": f"{source}:{target['id']}",
                    "text_en": text,
                    "target_word": word,
                    "target_surface": target["surface"],
                    "target_char_start": target["start"],
                    "target_char_end": target["end"],
                    "sense_id": sense,
                    "pos": target["pos"],
                    "source_dataset": source,
                    "original_sense_ids": original,
                    "label_provenance": "babelnet_to_contexta_reviewed"
                }

                assert text[target["start"]:target["end"]] == target["surface"]

                out.write(json.dumps(record, ensure_ascii=False) + "\n")
                counts[source] += 1

            elem.clear()

print("Saved:", output)
print("Exported records:", sum(counts.values()))
print("By source:", dict(counts))
print("Skipped:", dict(skipped))
