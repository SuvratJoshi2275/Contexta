# Training and research protocol

1. Audit actual source schema (`python scripts/cli.py audit`). 2. Extract candidates (`python scripts/cli.py extract`). 3. Annotate candidates independently by two people. 4. Resolve disagreements and export reviewed, split-preserving gold JSONL. 5. Verify each target and sense has sufficient examples. 6. Fine-tune with `python scripts/cli.py wsd --train ... --validation ...`. 7. Evaluate only on held-out reviewed test JSONL (`python scripts/cli.py evaluate --gold ...`).

The supervised architecture uses fast-tokenizer offset mappings, masked target-token pooling, a trainable linear classification head, cross-entropy, AdamW and validation checkpoint selection. A prototype experiment should average target embeddings from gold training examples only, then calibrate on validation. Unseen senses cannot be evaluated as trained classes. All reported metrics must come from actual runs.
