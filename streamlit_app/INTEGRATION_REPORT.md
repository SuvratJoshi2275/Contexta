# Integration report

## Implemented
12 navigation sections, dark theme, FastAPI-connected WSD with explicit target character spans, token LID, Marian translation, model comparison, inventory, bounded dataset previews, artifact exploration, CSV batch inference, candidate review and annotation submission, experiment registry, and JSON/CSV exports.

## Existing verified interfaces in supplied source
`GET /api/health`, `/api/inventory`, `/api/candidates`, `/api/annotations`; `POST /api/predict`, `/api/compare`, `/api/lid`, `/api/translate`, `/api/annotations`. No existing source files were changed.

## Limits / unverified
The handoff excludes full model weights and external datasets; real model inference and dataset scans must be verified on the owner's Mac. Backend availability is required for live operations. Historical benchmark artifact schemas are rendered faithfully as JSON instead of fabricating comparative metrics. Annotation candidates must be restored if missing. Streamlit frontend smoke testing requires Streamlit installed. Dataset directory size calculation can be slow on large corpora; it is metadata-only and never reads file contents. Batch requests are sequential to bound resource use.
