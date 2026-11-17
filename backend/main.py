import sys,json,csv,io
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from fastapi import FastAPI,HTTPException,UploadFile,File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,Field
from senseforge.core import INVENTORY,predict,detect,ROOT
from senseforge.integrated_inference import artifact_status, hybrid_predict, predict_lora, identify_languages, locate_target, translate_en_hi

from senseforge.data import audit
from senseforge.annotation import save,records,gold
app=FastAPI(title='SenseForge API',version='1.0.0')
app.add_middleware(CORSMiddleware,allow_origins=['http://localhost:5173','http://127.0.0.1:5173'],allow_methods=['*'],allow_headers=['*'])
class Query(BaseModel):
 text:str=Field(min_length=1,max_length=5000)
 word:str|None=None
 method:str='hybrid'
 target_char_start:int|None=None
 target_char_end:int|None=None
 include_translation:bool=False
class Annotation(BaseModel):
 item_id:str;word:str;sense_id:str;annotator:str;status:str='reviewed'
@app.get('/api/health')
def health():
 status=artifact_status()
 return {
  'status':'ok',
  'inventory_words':len(INVENTORY),
  'neural_checkpoint':status['wsd_lora'],
  'lid_checkpoint':status['lid'],
  'translation_checkpoint':status['translation'],
  'models':status
 }

@app.get('/api/inventory')
def inventory():return INVENTORY
@app.get('/api/detect')
def detected(text:str):return {'words':detect(text)}
@app.post('/api/predict')
def inference(q:Query):
 try:
  if q.method in ('dictionary','rule'):
   return predict(q.text,q.word,q.method)

  if q.method not in ('neural','hybrid'):
   raise HTTPException(422,'Unsupported prediction method')

  if not q.word:
   raise HTTPException(422,'Target word required')

  result=hybrid_predict(
   q.text,q.word,
   start=q.target_char_start,
   end=q.target_char_end,
   include_translation=q.include_translation
  )

  if q.method=='neural' and result['word'] in INVENTORY:
   word=result['word']
   if word not in ('bank','interest','plant','point','right','table'):
    raise HTTPException(422,'Neural model does not support this word')

   start,end=result['target_span']
   neural=predict_lora(q.text,word,start,end)
   sense=next(
    s for s in INVENTORY[word]['senses']
    if s['id']==neural['sense_id']
   )
   result.update({
    'sense_id':neural['sense_id'],
    'hindi':sense['hindi'],
    'definition':sense['definition'],
    'confidence':neural['confidence'],
    'method':'neural_lora',
    'status':'neural_prediction'
   })

  return result

 except HTTPException:
  raise
 except ValueError as e:
  raise HTTPException(422,str(e))


@app.post('/api/compare')
def compare(q:Query):
 try:
  if not q.word:
   raise HTTPException(422,'Target word required')

  dictionary=predict(q.text,q.word,'dictionary')
  rule=predict(q.text,q.word,'rule')

  hybrid=hybrid_predict(
   q.text,q.word,
   start=q.target_char_start,
   end=q.target_char_end,
   include_translation=q.include_translation
  )

  neural=None
  if q.word.lower() in (
   'bank','interest','plant','point','right','table'
  ):
   start,end=hybrid['target_span']
   prediction=predict_lora(
    q.text,q.word.lower(),start,end
   )
   sense=next(
    s for s in INVENTORY[q.word.lower()]['senses']
    if s['id']==prediction['sense_id']
   )
   neural={
    'sense_id':prediction['sense_id'],
    'hindi':sense['hindi'],
    'definition':sense['definition'],
    'confidence':prediction['confidence'],
    'method':'neural_lora'
   }

  return {
   'dictionary':dictionary,
   'rule':rule,
   'neural':neural,
   'hybrid':hybrid,
   'token_languages':hybrid['token_languages'],
   'translation_hi':hybrid['translation_hi'],
   'warnings':hybrid['warnings']
  }

 except HTTPException:
  raise
 except ValueError as e:
  raise HTTPException(422,str(e))


@app.post('/api/translate')
def translate(q:Query):
 try:
  return {
   'source_en':q.text,
   'translation_hi':translate_en_hi(q.text),
   'model':'finetuned_marianmt',
   'experimental':True
  }
 except ValueError as e:
  raise HTTPException(422,str(e))


@app.post('/api/lid')
def language_identification(q:Query):
 return {
  'text':q.text,
  'tokens':identify_languages(q.text),
  'model':'comilingua_3class'
 }


@app.get('/api/datasets')
def datasets():return audit()
@app.get('/api/experiments')
def experiments():
 return {p.name:json.loads(p.read_text()) for p in (ROOT/'reports').glob('*.json')}
@app.get('/api/annotations')
def annotations():return {'records':records(),'gold':gold()}
@app.post('/api/annotations')
def annotate(a:Annotation):
 try:save(a.item_id,a.word,a.sense_id,a.annotator,a.status)
 except ValueError as e:raise HTTPException(422,str(e))
 return {'saved':True}
@app.get('/api/candidates')
def candidates(offset:int=0,limit:int=30):
 p=ROOT/'artifacts/candidates.jsonl'
 if not p.exists():return {'items':[],'message':'Run candidate extraction first'}
 import itertools
 with p.open() as f:return {'items':[json.loads(x) for x in itertools.islice(f,max(offset,0),max(offset,0)+min(max(limit,1),100))]}
@app.post('/api/batch')
async def batch(file:UploadFile=File(...)):
 raw=await file.read()
 if len(raw)>5_000_000:raise HTTPException(413,'5 MB CSV maximum')
 try:
  rows=list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
  if len(rows)>1000:raise HTTPException(413,'1000 row maximum')
  if not rows or 'text' not in rows[0]:raise HTTPException(422,'CSV requires text column')
  out=[]
  for row in rows:
   try:res=predict(row['text'],row.get('word') or None)
   except ValueError as e:res={'error':str(e)}
   out.append({**row,**res})
  return {'rows':out,'count':len(out)}
 except UnicodeError:raise HTTPException(422,'CSV must be UTF-8')
