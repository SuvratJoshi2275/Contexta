# SenseForge Streamlit

Place this `streamlit_app/` directory directly inside the original SenseForge root. The original `backend/`, `src/`, `artifacts/`, `configs/`, and `notebooks/` must remain alongside it. No research files are replaced.

```bash
cd '/Users/suvratsmacbookair/MyLocalFiles/NLP project/SenseForge'
source .venv/bin/activate
pip install -r streamlit_app/requirements.txt
pip install -r backend/requirements.txt
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

In a second terminal (same project and venv):

```bash
streamlit run streamlit_app/app.py
```

Set `SENSEFORGE_ROOT` to override root discovery or `SENSEFORGE_API` to change the API address. External datasets are read from the project parent; large corpora are never copied. Backend calls run existing trained inference services, not a substitute model. The UI does not initialize transformers directly, but the backend may require substantial memory. The supplied handoff ZIP excludes some checkpoint weights; real inference requires the original local artifacts.

## Research integrity

The WSD metrics are from small custom test partitions; token-level LID uses a provisional three-class mapping; translation is experimental and may be semantically wrong. Missing artifacts are displayed as unavailable rather than replaced with sample predictions. Batch processing calls the real `/api/predict` endpoint per row with a 250-row cap; it does not use the legacy `/api/batch` rule-only implementation.
