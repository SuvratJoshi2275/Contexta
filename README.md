# SenseForge — Context-Aware Rule-Based Translation of Ambiguous English Words

A local-first research workbench with a 35-word bilingual sense inventory, deterministic dictionary and contextual rule baselines, real COMI-LINGUA token-level LID training, candidate extraction from IIT Bombay/Samanantar, two-annotator review, FastAPI backend, React UI, and supervised transformer training code.

## Quick start (macOS)
```bash
cd SenseForge
bash scripts/setup_mac.sh
source .venv/bin/activate
export SENSEFORGE_DATA_ROOT="/Users/suvratsmacbookair/MyLocalFiles/NLP project"
bash scripts/validate_datasets.sh
bash scripts/prepare_data.sh --limit 10000
bash scripts/run_backend.sh
# in another terminal
bash scripts/run_frontend.sh
```
Visit http://127.0.0.1:5173 and http://127.0.0.1:8000/docs.

## Training
COMI-LINGUA LID: `python scripts/cli.py lid` (trains character TF-IDF + SGD log-loss classifier and evaluates on provided LID test split). WSD supervised fine-tuning: `python scripts/cli.py wsd --train artifacts/gold_train.jsonl --validation artifacts/gold_validation.jsonl`. Gold files must be reviewed and contain `text`, `word`, `sense_id`. No automatic labels are treated as gold.

## Important scientific limitations
Rule predictions use transparent lexical overlap with deterministic fallback. The curated inventory is a starting point, not independently linguistically certified. The model comparison UI intentionally shows neural/hybrid as unavailable until trained/deployed. Supervised transformer code is provided, but no checkpoint is bundled. Candidate extraction requires pyarrow and access to original corpora. Samanantar has only 4 of 8 shards. This repository does not claim full-sentence machine translation or verified WSD accuracy.
