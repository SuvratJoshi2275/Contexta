# Architecture

```mermaid
flowchart LR
  A[Raw corpora] --> B[Schema audit / candidate extraction]
  B --> C[Annotation Studio]
  C --> D[Reviewed gold records]
  D --> E[WSD fine-tuning / evaluation]
  F[Sense inventory] --> G[Rule engine]
  G --> H[FastAPI]
  E --> H
  H --> I[React workbench]
  A --> J[COMI-LINGUA LID training]
```

The FastAPI service currently serves only the verified deterministic methods. It never advertises untrained neural inference as available. All paths derive from repository root or SENSEFORGE_DATA_ROOT.
