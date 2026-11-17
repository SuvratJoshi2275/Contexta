# Contexta — SenseForge research pipeline upgrade

This is an isolated copy of the uploaded SenseForge source with 12 reengineered notebooks and shared modules. Original uploads are untouched.

## Mac setup

```bash
cd SenseForge
sh scripts/setup_contexta_mac.sh
source .venv/bin/activate
export PYTHONPATH="$PWD/src"
export CONTEXTA_DATA_ROOT="/Users/suvratsmacbookair/MyLocalFiles/NLP project"
sh scripts/test_contexta.sh
sh scripts/run_contexta.sh
```

Execute notebooks **01 → 12**. Notebook 02 only processes training corpora after both official IIT-B validation/test files are available for exclusion. Samanantar's `src/tgt` language direction must be explicitly supplied using `CONTEXTA_SAMANANTAR_DIRECTION=en-hi` or `hi-en`; never assume Romanized Hindi is English. Full data is not bundled. All outputs go to `artifacts/`.

## Human labeling protocol

Notebook 03 writes an **unlabeled** JSONL annotation queue. Notebook 04 exposes `save(item_id,word,sense_id,annotator)` and `adjudicate(item_id,word,sense_id,adjudicator)` in the persistent SQLite annotation module. Two independent matching human reviews or an explicit adjudication are needed before exporting WSD gold. Review the inventory sense definitions before labeling. Disagreements must be adjudicated, not automatically guessed. Grouped splitting prevents normalized sentences from appearing across WSD partitions. The notebook does not generate WSD labels from translation pairs or COMI-LINGUA LID.

## Training and evaluation

Notebook 07 is a small genuine target-span XLM-R prototype. Notebook 08 trains the supervised WSD target-span classifier from human gold. Notebook 09 trains an XLM-R token classifier on COMI-LINGUA human LID tags with subword masking. They use PyTorch optimizers, MPS/CUDA/CPU selection, validation, early stopping, checkpoints and plots. Models and tokenizers download on first use; no pretrained model weights are bundled. Notebook 10 defines validation-only confidence-threshold calibration and hybrid routing; loads the supervised checkpoint for neural routing. Notebooks 11–12 compute real dictionary/rule baselines on human gold. Neural and hybrid inference are included in the benchmark when both the checkpoint and validation calibration are available. Do not report neural benchmark performance until a compatible saved checkpoint and inference adapter are available.

## Scientific limitations

The original archive contains no full IIT-B, Samanantar or COMI-LINGUA corpora. The notebooks have not been run on those corpora and no model has been trained. COMI CSV field names, language directions and inventory coverage must be verified locally. Original SenseForge web frontend and backend are retained as reference; production app integration is not verified. This package is a reproducible research implementation, not evidence of improved accuracy.
