import json
from pathlib import Path
from config import ROOT,ART,DATASETS

def json_artifacts(folder):
 base=(ART/folder).resolve()
 if not base.is_relative_to(ART.resolve()) or not base.exists():return {}
 out={}
 for p in sorted(base.rglob('*.json'))[:150]:
  try:out[str(p.relative_to(ART))]=json.loads(p.read_text())
  except (OSError,ValueError):continue
 return out

def inventory():
 p=ROOT/'configs/inventory.json'
 return json.loads(p.read_text()) if p.is_file() else {}

def dataset_status():
 return [{'Dataset':name,'Available':path.exists(),'Location':str(path),'Size (MB)':round(sum(p.stat().st_size for p in path.rglob('*') if p.is_file())/1048576,1) if path.is_dir() else None} for name,path in DATASETS.items()]

def preview(path,limit=30):
 import pandas as pd
 suffix=path.suffix.lower()
 if suffix=='.csv':return pd.read_csv(path,nrows=limit)
 if suffix=='.parquet':
  import pyarrow.parquet as pq
  pf=pq.ParquetFile(path);return next(pf.iter_batches(batch_size=limit)).to_pandas()
 if suffix=='.jsonl':return pd.DataFrame([json.loads(line) for _,line in zip(range(limit),path.open())])
 raise ValueError('Unsupported preview format')
