import os
from pathlib import Path

ROOT = Path(
    os.getenv(
        "CONTEXTA_ROOT",
        os.getenv(
            "SENSEFORGE_ROOT",
            str(Path(__file__).resolve().parents[1])
        )
    )
).expanduser().resolve()

ART = ROOT / "artifacts"

DATA_ROOT = Path(
    os.getenv(
        "CONTEXTA_DATA_ROOT",
        str(ROOT / "datasets")
    )
).expanduser().resolve()

DATASETS = {
    "Comi-Lingua": DATA_ROOT / "Comi-Lingua",
    "IIT-B": DATA_ROOT / "Data_IIT-B_Hugging_Face",
    "Samanantar": DATA_ROOT / "Dataset_Samanantar",
    "XL-WSD": DATA_ROOT / "xl-wsd",
}

API = os.getenv(
    "CONTEXTA_API",
    os.getenv("SENSEFORGE_API", "http://127.0.0.1:8000")
).rstrip("/")
