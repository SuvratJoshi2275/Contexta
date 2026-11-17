import os,csv,hashlib,json,ast,re
from pathlib import Path
from .core import INVENTORY,ROOT
SOURCE_MAP={'lid_train':'Comi-Lingua/LID_train.csv','lid_test':'Comi-Lingua/LID_test.csv','mt_train':'Comi-Lingua/MT_train.csv','mt_test':'Comi-Lingua/MT_test.csv','iit_train':'Data_IIT-B_Hugging_Face/train-00000-of-00001.parquet','iit_validation':'Data_IIT-B_Hugging_Face/validation-00000-of-00001.parquet','iit_test':'Data_IIT-B_Hugging_Face/test-00000-of-00001.parquet',**{f'samanantar_{i}':f'Dataset_Samanantar/train-{i:05d}-of-00008.parquet' for i in range(4)}}
def source_paths():
 base=Path(os.environ.get('CONTEXTA_DATA_ROOT',os.environ.get('SENSEFORGE_DATA_ROOT',str(ROOT/'datasets'))))
 return {k:base/v for k,v in SOURCE_MAP.items()}
def audit():
 out={}
 for key,path in source_paths().items():
  if not path.exists():out[key]={'available':False,'path':str(path)};continue
  if path.suffix=='.csv':
   with path.open(encoding='utf-8-sig',newline='') as f:
    reader=csv.reader(f);columns=next(reader);count=sum(1 for _ in reader)
   out[key]={'available':True,'rows':count,'columns':columns,'path':str(path)}
  else:
   try:
    import pyarrow.parquet as pq
    pf=pq.ParquetFile(path)
    out[key]={'available':True,'rows':pf.metadata.num_rows,'columns':pf.schema_arrow.names,'path':str(path)}
   except ImportError:out[key]={'available':True,'rows':None,'columns':None,'path':str(path),'warning':'Install pyarrow to inspect Parquet'}
 return out
def pairs(path,batch_size=2048):
 import pyarrow.parquet as pq
 pf=pq.ParquetFile(path)
 for batch in pf.iter_batches(batch_size=batch_size):
  for row in batch.to_pylist():
   if 'translation' in row and isinstance(row['translation'],dict):
    d=row['translation'];en=d.get('en');hi=d.get('hi')
   else:
    en=next((row[k] for k in ('en','english','src','source') if k in row),None)
    hi=next((row[k] for k in ('hi','hindi','tgt','target') if k in row),None)
   if isinstance(en,str) and isinstance(hi,str):yield en,hi

def extract(limit_per_source=10000):
 out=ROOT/'artifacts/candidates.jsonl';out.parent.mkdir(exist_ok=True)
 seen=set();counts={}
 with out.open('w',encoding='utf8') as f:
  for name,path in source_paths().items():
   if not name.startswith(('iit_','samanantar_')) or not path.exists():continue
   counts[name]=0
   for en,hi in pairs(path):
    words=[w for w in INVENTORY if re.search(r'(?<!\w)'+re.escape(w)+r'(?!\w)',en.casefold())]
    for w in words:
     digest=hashlib.sha256((en.strip().casefold()+'|'+w).encode()).hexdigest()
     if digest in seen:continue
     seen.add(digest)
     f.write(json.dumps({'id':digest,'text':en,'hindi_sentence':hi,'word':w,'source':name,'split':name.split('_')[-1] if name.startswith('iit_') else 'train','label':None,'label_status':'unlabelled'},ensure_ascii=False)+'\n')
     counts[name]+=1
     if counts[name]>=limit_per_source:break
    if counts[name]>=limit_per_source:break
 return counts

def lid_examples(path):
 with open(path,encoding='utf8',newline='') as f:
  for row in csv.DictReader(f):
   raw=row.get('Annotated by: Annotator 1','')
   try: tags=ast.literal_eval(raw)
   except (SyntaxError,ValueError):continue
   if isinstance(tags,list):
    for t in tags:
     if isinstance(t,dict) and t.get('value') in ('en','hi','ot') and isinstance(t.get('key'),str):yield t['key'],t['value']
