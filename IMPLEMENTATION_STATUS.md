# Implementation status

- Implemented: 35-word inventory; lexical-rule inference and dictionary baseline; API inference/compare; batch CSV; candidate queue; two-annotator SQLite review; gold agreement query; CSV LID reader; LID training and held-out reporting; transformer target-span training loop; evaluation metrics; React application; 12 notebooks; unit/API tests.
- Partial: contextual prototype and hybrid experiments are notebook research guides rather than completed deployed models; POS/dependency parsing not integrated; rule inventory needs independent linguistic verification; gold export/split reconciliation must be performed before WSD fine-tuning; annotation UI presents first 30 candidates; advanced analytics/ablation charts not yet implemented.
- Not executed here: full-data WSD training, LID training, frontend production build, Parquet schema audit (pyarrow unavailable in build environment).
- Never interpret unlabelled mined sentence pairs as gold WSD data.
