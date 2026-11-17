import os
from pathlib import Path
ROOT=Path(os.getenv('SENSEFORGE_ROOT',Path(__file__).resolve().parents[1])).expanduser().resolve()
ART=ROOT/'artifacts'
DATASETS={'Comi-Lingua':ROOT.parent/'Comi-Lingua','IIT-B':ROOT.parent/'Data_IIT-B_Hugging_Face','Samanantar':ROOT.parent/'Dataset_Samanantar','XL-WSD':ROOT/'datasets'/'xl-wsd'}
API=os.getenv('SENSEFORGE_API','http://127.0.0.1:8000').rstrip('/')
