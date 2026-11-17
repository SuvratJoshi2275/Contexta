# PROJECT_SUMMARY.md — SenseForge (Contexta Research)

**Project:** SenseForge  
**Research identity:** Contexta Research  
**Category:** Natural Language Processing / Multilingual AI  
**Status:** ML research and notebook-level integration completed; Streamlit application planned  
**Last updated:** 17 November 2026

---

## 1. WHAT IS THE PROJECT?

**SenseForge** is a multilingual NLP research platform that identifies the contextual meaning of ambiguous English words, predicts Hindi meanings, detects Hindi–English code-mixed tokens, and performs English–Hindi neural machine translation.

It combines dictionary/rule-based methods, classical machine learning, XLM-RoBERTa with LoRA, token-level language identification, and MarianMT translation.

### Primary capabilities

- Word Sense Disambiguation (WSD)
- Context-aware Hindi word meanings
- English/Hindi code-mixed Language Identification (LID)
- English–Hindi Neural Machine Translation (NMT)
- Hybrid neural/rule-based inference
- Model benchmarking, ablation studies, and error analysis
- Dataset exploration and human annotation
- Interactive NLP research dashboard

---

## 2. NOTEBOOKS — COMPLETE LIST (01–20)

The project initially contained 12 research notebooks and was later extended to 20.

| No. | Notebook | Purpose |
|---|---|---|
| 01 | `01_Dataset_Audit_EDA.ipynb` | Audits datasets, schemas, distributions, and corpus quality. |
| 02 | `02_Corpus_Preprocessing.ipynb` | Cleans and prepares parallel text, including approximately 6 million training-only sentence pairs. |
| 03 | `03_Ambiguity_Extraction.ipynb` | Extracts ambiguous-word contexts and generates annotation candidates. |
| 04 | `04_Sense_Annotation_Improved.ipynb` | Supports sense annotation, annotation review, and dataset preparation. |
| 05 | `05_Dictionary_Baseline.ipynb` | Implements dictionary-based word sense prediction. |
| 06 | `06_Rule_Based_WSD.ipynb` | Implements lexical-cue-based WSD with interpretable decision evidence. |
| 07 | `07_XLMR_Prototype_Training_FIXED.ipynb` | Experiments with frozen XLM-R contextual representations and prototype-based WSD. |
| 08 | `08_XLMR_Supervised_Training.ipynb` | Implements supervised neural WSD experiments. |
| 09 | `09_Hinglish_LID_Training.ipynb` | Explores language identification and an early XLM-R LID experiment. |
| 10 | `10_Hybrid_WSD.ipynb` | Combines neural predictions with rule-based fallback and confidence-threshold routing. |
| 11 | `11_Model_Evaluation.ipynb` | Compares dictionary, rules, Logistic Regression, Residual MLP, LoRA, and hybrid WSD. |
| 12 | `12_Ablations_Error_Analysis.ipynb` | Analyzes model disagreements, fallback errors, and lemma-restriction ablations. |
| 13 | `13_Advanced_Neural_WSD.ipynb` | Advanced neural WSD experiments; exact implementation should be verified from notebook source. |
| 14 | `14_Robustness & Generalization Evaluation.ipynb` | Evaluates WSD robustness and generalization; exact experiments require notebook inspection. |
| 15 | `15_XLMR_Parameter_Efficient_Finetuning.ipynb` | Fine-tunes XLM-R using LoRA, saves adapter/head checkpoints, and evaluates challenge examples. |
| 16 | `16_Independent WSD Benchmark & Generalization Audit.ipynb` | Investigates independent XL-WSD evaluation and limitations of mapping external senses to the custom inventory. |
| 17 | `17_.ipynb` | Final SenseForge integration, artifact audit, regression checks, and Comi-Lingua annotation/data preparation. Filename is currently incomplete. |
| 18 | `18_Comi-Lingua Token-Level LID Training.ipynb` | Builds leakage-safe Comi-Lingua splits and trains/evaluates six-class and normalized three-class LID models. |
| 19 | `19_English- Hindi Neural Machine Translation.ipynb` | Fine-tunes MarianMT using IIT-B and Samanantar and evaluates BLEU/chrF translation quality. |
| 20 | `20_SenseForge End-to-End Integration.ipynb` | Integrates trained WSD, LID, and translation models into a unified inference pipeline. |

### Development sequence

- **01–04:** Dataset preparation, ambiguity extraction, and annotation.
- **05–06:** Dictionary and rule-based WSD baselines.
- **07–09:** Transformer, supervised WSD, and early language identification experiments.
- **10–12:** Hybrid inference, model comparisons, ablations, and error analysis.
- **13–14:** Additional neural WSD and robustness research.
- **15:** Parameter-efficient XLM-R LoRA fine-tuning.
- **16:** Independent benchmark investigation.
- **17:** Research integration and multilingual dataset preparation.
- **18:** Full Comi-Lingua token-level LID training.
- **19:** English–Hindi neural machine translation fine-tuning.
- **20:** Unified end-to-end model integration.

---

## 3. DATASETS

### Original datasets

The initial SenseForge research used datasets available inside the project, including SemCor-derived WSD resources, lexical inventories, and multilingual parallel-text preparation.

The repository also contains:

`SenseForge/datasets/xl-wsd/`

XL-WSD was investigated for independent evaluation. However, its WordNet-style sense inventory did not directly align with SenseForge's custom two-sense labels.

### Additional datasets

Three external datasets were subsequently used:

| Dataset | Purpose | Location |
|---|---|---|
| Comi-Lingua | Hindi–English code-mixed LID | `../Comi-Lingua/` |
| IIT-B English–Hindi | Parallel translation training/evaluation | `../Data_IIT-B_Hugging_Face/` |
| Samanantar | Additional English–Hindi parallel training examples | `../Dataset_Samanantar/` |

### Actual folder structure

```text
NLP project/
├── Comi-Lingua/
├── Data_IIT-B_Hugging_Face/
├── Dataset_Samanantar/
├── SenseForge/
└── _Archive_Review/
```

The three external datasets must remain in their current locations unless all references are updated.

### Dataset sizes

Approximate measured on-disk sizes:

| Dataset | Size |
|---|---:|
| Comi-Lingua | 209 MB |
| IIT-B | 181 MB |
| Samanantar | 1.1 GB |
| Internal XL-WSD | 1.3 GB |

**Total active dataset storage:** approximately 2.8 GB, including XL-WSD. This is disk usage, not total uncompressed text size.

### Comi-Lingua

Files:

- `LID_train.csv`
- `LID_test.csv`
- `MT_train.csv`
- `MT_test.csv`

LID columns:

```text
Sentences
Predicted tags
Annotated by: Annotator 1
Annotated by: Annotator 2
Annotated by: Annotator 3
```

Original LID records:

- Train: 30,487 sentences
- Test: 5,000 sentences

Six annotation labels:

`hi`, `en`, `ot`, `h`, `e`, `u`

A provisional three-class normalization was developed:

`hi`, `en`, `other`

The initial supplied train/test files contained 4,120 overlapping sentence strings. Therefore, leakage-safe splits were reconstructed.

Final cleaned splits:

| Split | Tokens | Sentences |
|---|---:|---:|
| Train | 428,197 | 21,884 |
| Validation | 92,552 | 4,688 |
| Test | 91,173 | 4,689 |
| **Total** | **611,922** | **31,261** |

Cross-split exact sentence overlap: **0**.

### IIT-B

Schema:

```text
translation: struct<
    en: string,
    hi: string
>
```

Original records:

- Train: 1,659,083
- Validation: 520
- Test: 2,507

Translation experiment selected:

- IIT-B training: 6,000
- Validation: 300
- Test: 300

### Samanantar

Available shards: 4 of 8.

Columns:

```text
idx
src
tgt
```

Detected direction:

`src = English`, `tgt = Hindi`

Available rows: approximately 5,062,854.

Selected training examples: 2,000.

### Final translation dataset

- Training: 8,000 sentence pairs
- Validation: 300 sentence pairs
- Test: 300 sentence pairs
- Exact source overlap between selected partitions: 0

---

## 4. FINAL MODELS AND RESULTS

SenseForge does not have one universal final model. It contains three primary trained NLP components.

### A. Final WSD model

**Model:** XLM-RoBERTa-base with LoRA and hybrid rule fallback.

Supported neural words:

`bank`, `interest`, `plant`, `point`, `right`, `table`

The curated inventory contains 35 ambiguous words, with rule-based handling available beyond the six neural targets.

Artifacts:

```text
artifacts/wsd_v2_lora/best_lora_adapter/
artifacts/wsd_v2_lora/best_classifier_head.pt
artifacts/hybrid_v2/hybrid_config.json
```

Hybrid confidence threshold: `0.75`.

#### WSD evaluation

62-example V2 test partition:

| Model | Accuracy | Macro-F1 |
|---|---:|---:|
| Dictionary | 0.3871 | 0.2923 |
| Rule-Based | 0.4677 | 0.4033 |
| Logistic Regression | 1.0000 | 1.0000 |
| Residual MLP | 1.0000 | 1.0000 |
| XLM-R LoRA | 0.9839 | 0.9896 |
| Hybrid LoRA | 0.9839 | 0.9896 |

LoRA challenge evaluation: 36/36 correct.

**Research limitation:** These are small, custom WSD evaluation partitions. Perfect scores must not be generalized to unrestricted real-world WSD.

#### Input/output contract

Python:

```python
hybrid_predict(
    text="The fisherman sat on the bank.",
    word="bank",
    include_translation=False
)
```

Representative output fields:

```json
{
  "word": "bank",
  "text": "The fisherman sat on the bank.",
  "target_surface": "bank",
  "target_span": [25, 29],
  "sense_id": "bank.2",
  "hindi": "किनारा",
  "definition": "river shore water stream nadi नदी",
  "confidence": 0.9999221563339233,
  "method": "hybrid_lora",
  "status": "neural_above_threshold",
  "evidence": [],
  "alternatives": [],
  "token_languages": [],
  "translation_hi": null,
  "warnings": []
}
```

`alternatives` and `token_languages` are populated dynamically; empty arrays above indicate their schema, not the actual observed complete response.

Confidence values are **not calibrated probabilities**.

### B. Final Language Identification model

**Model:** Character TF-IDF + Logistic Regression.

Final classification scheme:

`hi`, `en`, `other`

Model file:

```text
artifacts/senseforge_final/comilingua_lid/training_v1/normalized_3class/comilingua_lid_3class.joblib
```

Held-out test results:

- Accuracy: **0.9481**
- Macro Precision: **0.9109**
- Macro Recall: **0.9504**
- Macro-F1: **0.9293**
- Test tokens: **91,173**

Input:

```json
{
  "text": "Hello mujhe bank jaana hai"
}
```

Output:

```json
{
  "text": "Hello mujhe bank jaana hai",
  "tokens": [
    {"token": "Hello", "language": "en", "start": 0, "end": 5},
    {"token": "mujhe", "language": "hi", "start": 6, "end": 11},
    {"token": "bank", "language": "en", "start": 12, "end": 16},
    {"token": "jaana", "language": "hi", "start": 17, "end": 22},
    {"token": "hai", "language": "hi", "start": 23, "end": 26}
  ],
  "model": "comilingua_3class"
}
```

### C. Final Neural Translation model

**Model:** `Helsinki-NLP/opus-mt-en-hi`

Architecture: MarianMT encoder–decoder transformer.

Training:

- 8,000 sentence pairs
- 2 epochs
- Apple MPS
- Best checkpoint selected from epoch 1
- Training time: approximately 1,231 seconds

Checkpoint:

```text
artifacts/translation_v1/finetuned/best_model/
```

Held-out test results (300 examples):

| Metric | Pretrained | Fine-tuned |
|---|---:|---:|
| SacreBLEU | 9.6598 | 9.9229 |
| chrF | 31.8254 | 31.9310 |

Fine-tuning produced only marginal improvement.

Input:

```json
{
  "text": "The bank approved the loan."
}
```

Observed model output:

```json
{
  "source_en": "The bank approved the loan.",
  "translation_hi": "बैंक ने उधार लिया है।",
  "model": "finetuned_marianmt",
  "experimental": true
}
```

**Limitation:** The example translation is semantically incorrect. Translation must be clearly marked experimental.

---

## 5. MAJOR CHANGES FROM 12 TO 20 NOTEBOOKS

1. Extended research beyond basic WSD and hybrid routing.
2. Added advanced neural WSD experiments and robustness investigations.
3. Introduced parameter-efficient LoRA fine-tuning.
4. Verified LoRA training on Apple Silicon MPS.
5. Implemented target-aware token alignment.
6. Added lemma-restricted neural inference.
7. Evaluated LoRA on validation, challenge, and held-out partitions.
8. Investigated independent XL-WSD benchmark compatibility.
9. Identified external sense-inventory mapping limitations.
10. Added research integration and artifact integrity checks.
11. Audited Comi-Lingua annotator agreement and label conventions.
12. Identified train/test sentence overlap in Comi-Lingua.
13. Rebuilt leakage-safe LID splits.
14. Cleaned repeated and conflicting annotation records.
15. Trained six-class LID baseline.
16. Investigated inconsistent annotation labels.
17. Introduced provisional normalized three-class LID.
18. Trained and evaluated the final three-class LID classifier.
19. Added IIT-B and Samanantar translation experiments.
20. Fine-tuned MarianMT for English–Hindi translation.
21. Compared pretrained and fine-tuned translation checkpoints.
22. Built unified WSD + LID + translation inference.
23. Created an independent reusable Python inference service.
24. Connected trained models to existing FastAPI endpoints.
25. Verified backend health, model comparison, and LID API calls.

### Integration smoke test

Notebook 20:

- 10/10 WSD demonstration cases correct.
- Multiple-occurrence target handling passed.
- Hindi meaning metadata consistency passed.
- LID, WSD, and translation checkpoints loaded.
- End-to-end inference outputs saved.

These are functional smoke tests, not independent generalization benchmarks.

---

## 6. FRONTEND AND BACKEND

### Original frontend

Technology:

- React 18
- TypeScript
- Vite
- Lucide icons
- Recharts

Existing sections:

1. Overview
2. Translation Lab
3. Sense Explorer
4. Rule Inspector
5. Datasets
6. Evaluation
7. Batch Processing
8. Annotation Studio
9. Experiments

### Original design system

- Premium dark-mode research dashboard
- Deep navy/charcoal backgrounds
- Teal/mint/cyan accent colors
- Rounded cards and panels
- Persistent left navigation
- Clean sans-serif typography
- Minimal gradients
- Research-oriented data tables
- Subtle borders and status indicators
- Professional, restrained visual hierarchy

### Existing backend

Technology:

- Python 3.11
- FastAPI
- Pydantic
- Uvicorn

Main file:

`backend/main.py`

Existing/upgraded API routes:

```text
GET  /api/health
GET  /api/inventory
GET  /api/detect
POST /api/predict
POST /api/compare
POST /api/lid
POST /api/translate
GET  /api/datasets
GET  /api/experiments
GET  /api/annotations
POST /api/annotations
GET  /api/candidates
POST /api/batch
```

Integrated inference module:

`src/senseforge/integrated_inference.py`

### Verified backend integration

- Health API: HTTP 200
- Model comparison: HTTP 200
- LID API: HTTP 200
- Real XLM-R LoRA inference: successful
- Hybrid WSD inference: successful
- Browser application: successfully launched

### Known frontend problems

- Primary Translation Lab result displays rule output instead of hybrid.
- Dataset explorer reports missing datasets due to outdated paths.
- Evaluation dashboard does not load current research artifacts.
- Experiment registry uses outdated report locations.
- Annotation queue is missing from its expected active path.
- Batch inference still uses legacy rules.
- LID and translation results are not fully visualized.
- Neural confidence and model provenance need better presentation.

---

## 7. CURRENT PROJECT STRUCTURE

```text
SenseForge/
├── artifacts/
│   ├── wsd_v2/
│   ├── wsd_v2_lora/
│   ├── wsd_v2_supervised/
│   ├── wsd_v2_advanced/
│   ├── hybrid_v2/
│   ├── evaluation_v2/
│   ├── ablation_v2/
│   ├── translation_v1/
│   ├── senseforge_final/
│   └── senseforge_end_to_end/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   └── style.css
│   ├── package.json
│   └── vite.config.ts
├── src/
│   └── senseforge/
│       ├── core.py
│       ├── inference.py
│       ├── integrated_inference.py
│       ├── neural.py
│       ├── training.py
│       ├── lid.py
│       ├── benchmark.py
│       └── ...
├── notebooks/
│   └── 01–20
├── configs/
│   └── inventory.json
├── datasets/
│   └── xl-wsd/
├── scripts/
├── tests/
├── integration_backup/
└── .venv/
```

### Storage cleanup already performed

- Active SenseForge reduced from approximately 7.9 GB to 4.3 GB.
- Historical artifacts moved to `../_Archive_Review/Legacy_Artifacts/`.
- Original trained model checkpoints preserved.
- Archived research artifacts have **not** been permanently deleted.
- Historical notebooks may require archived files if rerun.

---

## 8. NEXT DEVELOPMENT PHASE — STREAMLIT

### Decision

Replace the React-based primary research UI with a new **Streamlit application**, while preserving the existing FastAPI backend and trained Python ML modules.

Do not delete the React frontend until the Streamlit implementation is fully verified.

### Planned architecture

```text
SenseForge/
├── backend/                 # Existing FastAPI backend
├── frontend/                # Existing React UI, retained
├── streamlit_app/           # New primary UI
│   ├── app.py
│   ├── config.py
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── styles/
│   └── utils/
├── src/senseforge/          # Existing trained-model inference
├── artifacts/               # Existing checkpoints and reports
└── notebooks/               # Existing research
```

Streamlit should reuse the existing FastAPI endpoints or verified Python inference services. Avoid duplicate ML implementations.

### Required Streamlit features

- Premium dark-mode UI
- Overview and research dashboard
- Contextual WSD Lab
- Token-level LID Studio
- Neural Translation Studio
- Model Comparison
- Sense Explorer
- Dataset Explorer
- Evaluation Dashboard
- Ablation and Error Analysis
- Batch Processing
- Annotation Studio
- Experiments and Research

### Engineering requirements

- No model retraining.
- No fabricated metrics or predictions.
- Use real saved checkpoints.
- Load transformer models lazily.
- Optimize for an Apple Silicon Mac with 8 GB unified memory.
- Use `st.cache_resource` for model resources.
- Use `st.cache_data` for suitable read-only data.
- Preserve original datasets and notebooks.
- Correct external dataset paths.
- Display honest unavailable states.
- Include confidence and evaluation limitations.
- Implement working navigation, actions, charts, and downloads.
- Validate application with real local checkpoints.

### Expected launch command

```bash
cd "/Users/suvratsmacbookair/MyLocalFiles/NLP project/SenseForge"

source .venv/bin/activate

streamlit run streamlit_app/app.py
```

---

## 9. FINAL STATUS

| Component | Status |
|---|---|
| WSD research | Completed |
| LoRA fine-tuning | Completed |
| WSD evaluation | Completed on available custom partitions |
| Comi-Lingua LID | Trained and tested |
| IIT-B + Samanantar NMT | Fine-tuned and evaluated |
| Notebook-level integration | Completed |
| Reusable inference module | Working |
| FastAPI model integration | Core endpoints verified |
| React frontend | Running, partially integrated |
| Dataset dashboard | Requires path fixes |
| Evaluation dashboard | Requires artifact integration |
| Annotation Studio | Requires queue reconciliation |
| Streamlit UI | Not yet implemented |
| Final application regression testing | Pending |

### Key instruction for future development

**Do not rebuild or retrain SenseForge from scratch.**

The primary research, trained checkpoints, notebook experiments, and core inference services already exist.

The remaining work is to build and verify a complete Streamlit research application that accurately exposes the existing models, datasets, evaluation results, experiments, and annotation workflows.

**Project objective:** Turn SenseForge from a collection of reproducible NLP research experiments into a cohesive, functional, professionally presented multilingual AI research platform.