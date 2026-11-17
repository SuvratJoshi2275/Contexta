import sys,json,io,csv,re
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import streamlit as st
import pandas as pd
import plotly.express as px
from config import ROOT,ART,DATASETS,API
from services.client import call,ServiceError
from services.research import json_artifacts,inventory,dataset_status,preview
st.set_page_config(page_title='Contexta | Multilingual Intelligence',page_icon='◈',layout='wide',initial_sidebar_state='expanded')
st.markdown('<style>'+ (Path(__file__).parent/'styles/theme.css').read_text()+'</style>',unsafe_allow_html=True)
PAGES=['Research Overview','Contextual WSD Laboratory','Code-Mixed Language Identification','Neural Translation Studio','Model Comparison Laboratory','Sense Inventory Explorer','Dataset Intelligence','Evaluation & Benchmarking','Ablation & Error Analysis','Batch Processing','Annotation Studio','Experiments & Research Registry']
with st.sidebar:
 st.markdown('## ◈ Contexta')
 st.caption('CONTEXTA RESEARCH · NLP PLATFORM')
 page=st.radio('WORKSPACE',PAGES,label_visibility='collapsed')
 st.divider();st.caption('Backend: '+API)
 if st.button('Check API connection',width='stretch'):
  try:st.json(call('health'))
  except ServiceError as e:st.error(str(e))
def header(title,subtitle):
 st.markdown('<div class="sf-eyebrow">CONTEXTA / RESEARCH WORKSPACE</div>',unsafe_allow_html=True)
 st.title(title);st.markdown(f'<div class="sf-sub">{subtitle}</div>',unsafe_allow_html=True)
def api(path,payload=None,params=None):
 try:return call(path,payload,params)
 except ServiceError as e:st.error('Inference service unavailable: '+str(e));return None
def download(data,name):st.download_button('Download JSON',json.dumps(data,ensure_ascii=False,indent=2,default=str),name,mime='application/json')
def show_artifacts(folder):
 items=json_artifacts(folder)
 if not items:st.info('No saved JSON research artifacts available in '+folder);return
 for name,value in items.items():
  with st.expander(name):st.json(value)
def target_form(key='wsd'):
 text=st.text_area('Context sentence','The fisherman sat on the bank.',key=key+'text')
 found=list(re.finditer(r'\b[\w]+\b',text,re.UNICODE));known=inventory()
 choices=[(m.group(),m.start(),m.end()) for m in found if m.group().lower() in known]
 if not choices:st.warning('No inventory word detected. Enter a sentence containing a supported word.');return None
 idx=st.selectbox('Target occurrence',range(len(choices)),format_func=lambda i:f'{choices[i][0]} · characters {choices[i][1]}–{choices[i][2]}',key=key+'target')
 word,start,end=choices[idx]
 return {'text':text,'word':word.lower(),'target_char_start':start,'target_char_end':end}
if page==PAGES[0]:
 header('Multilingual intelligence, grounded in research','Context-aware word senses · Hindi–English language identification · neural translation')
 inv=inventory();reports=json_artifacts('evaluation_v2');health=None
 try:health=call('health')
 except ServiceError:pass
 a,b,c,d=st.columns(4)
 a.metric('Ambiguous lemmas',len(inv));b.metric('Research notebooks',len(list((ROOT/'notebooks').glob('*.ipynb'))));c.metric('WSD neural targets',6);d.metric('API status','Connected' if health else 'Offline')
 st.subheader('Model readiness')
 if health:st.json(health)
 else:st.info('Start the existing FastAPI server to enable live model inference. No sample predictions are substituted.')
 st.subheader('Dataset availability');st.dataframe(pd.DataFrame(dataset_status()),hide_index=True,width='stretch')
 st.subheader('Research evidence');show_artifacts('senseforge_end_to_end')
elif page==PAGES[1]:
 header('Contextual WSD Laboratory','Target-aware disambiguation with actual hybrid LoRA inference and rule fallback')
 payload=target_form()
 if payload and st.button('Disambiguate context',type='primary'):
  with st.spinner('Running model inference…'):result=api('predict',{**payload,'method':'hybrid'})
  if result:
   st.session_state['wsd_result']=result
 if st.session_state.get('wsd_result'):
  result=st.session_state['wsd_result'];a,b,c=st.columns(3)
  a.metric('Hindi meaning',result.get('hindi','—'));b.metric('Sense',result.get('sense_id','—'));c.metric('Method',result.get('method','—'))
  st.write(result.get('definition',''));st.caption('Confidence is not a calibrated probability.')
  with st.expander('Prediction trace, alternatives and evidence',expanded=True):st.json(result)
  download(result,'senseforge_wsd.json')
elif page==PAGES[2]:
 header('Code-Mixed Language Identification','Supervised token-level Hindi / English / Other classification')
 text=st.text_area('English, Hindi or Hinglish text','Hello mujhe bank jaana hai')
 if st.button('Identify languages',type='primary') and text.strip():
  result=api('lid',{'text':text})
  if result:st.session_state['lid_result']=result
 if st.session_state.get('lid_result'):
  result=st.session_state['lid_result'];tokens=result.get('tokens',[])
  if tokens:
   df=pd.DataFrame(tokens);st.dataframe(df,width='stretch',hide_index=True)
   if 'language' in df:st.plotly_chart(px.pie(df,names='language',title='Token distribution',hole=.55),width='stretch')
   st.markdown(' '.join(f'`{t.get("token", "")}` **{t.get("language", "?")}**' for t in tokens))
  st.caption('Token-only model; three-class annotation mapping is provisional.');download(result,'senseforge_lid.json')
elif page==PAGES[3]:
 header('Neural Translation Studio','Experimental fine-tuned MarianMT · English → Hindi')
 st.warning('Research model: translations can contain semantic errors and must be verified.')
 text=st.text_area('English source sentence','The bank approved the loan.')
 if st.button('Translate',type='primary') and text.strip():
  result=api('translate',{'text':text})
  if result:st.session_state['translation_result']=result
 if st.session_state.get('translation_result'):
  result=st.session_state['translation_result'];a,b=st.columns(2)
  a.text_area('Source',result.get('source_en',''),disabled=True);b.text_area('Hindi translation',result.get('translation_hi',''),disabled=True)
  download(result,'senseforge_translation.json')
 st.caption('Individual translation quality scores are not inferred without reference translations.')
elif page==PAGES[4]:
 header('Model Comparison Laboratory','Compare live supported adapters and saved historical evaluations')
 payload=target_form('comparison')
 if payload and st.button('Run live comparison',type='primary'):
  result=api('compare',payload)
  if result:
   st.json(result);download(result,'senseforge_comparison.json')
 st.subheader('Historical benchmark artifacts');show_artifacts('evaluation_v2')
 st.caption('Logistic Regression and MLP are historical benchmarks unless independently deployed as live inference adapters.')
elif page==PAGES[5]:
 header('Sense Inventory Explorer','Explore curated ambiguous lemmas, Hindi glosses and lexical evidence')
 inv=inventory();search=st.text_input('Search words or meanings');words=[w for w,v in inv.items() if search.lower() in (w+' '+json.dumps(v,ensure_ascii=False)).lower()]
 st.caption(f'{len(words)} / {len(inv)} words')
 for word in words:
  with st.expander(word.upper()+' · '+('Neural + rules' if word in ['bank','interest','plant','point','right','table'] else 'Rules / dictionary')):
   st.dataframe(pd.DataFrame(inv[word].get('senses',[])),width='stretch',hide_index=True)
elif page==PAGES[6]:
 header('Dataset Intelligence','Bounded previews, schema discovery and external corpus availability')
 st.dataframe(pd.DataFrame(dataset_status()),width='stretch',hide_index=True)
 name=st.selectbox('Dataset',list(DATASETS));base=DATASETS[name]
 if base.exists():
  files=[p for p in base.rglob('*') if p.is_file() and p.suffix.lower() in ('.csv','.parquet','.jsonl')][:300]
  if files:
   chosen=st.selectbox('Inspect file',files,format_func=lambda p:str(p.relative_to(base)))
   try:
    frame=preview(chosen,30);st.write('Columns:',list(frame.columns));st.dataframe(frame,width='stretch',hide_index=True)
   except Exception as e:st.warning(f'Preview unavailable: {e}')
  else:st.info('No supported tabular file found within scan limit.')
 else:st.info('Dataset directory is not present in this environment. Configure CONTEXTA_DATA_ROOT or place datasets inside Contexta/datasets.')
 st.subheader('Saved data audits');show_artifacts('senseforge_final')
elif page==PAGES[7]:
 header('Evaluation & Benchmarking','Reported metrics, protocols and model provenance from saved artifacts')
 for folder in ['evaluation_v2','senseforge_final/comilingua_lid/training_v1/normalized_3class','translation_v1']:
  st.subheader(folder);show_artifacts(folder)
 st.caption('Custom WSD partitions are not independent open-domain benchmarks. Never interpret perfect accuracy as universal generalization.')
elif page==PAGES[8]:
 header('Ablation & Error Analysis','Saved lemma-restriction studies, hybrid routing and robustness evidence')
 show_artifacts('ablation_v2');show_artifacts('hybrid_v2')
 st.subheader('Other research diagnostics');show_artifacts('wsd_v2_lora')
elif page==PAGES[9]:
 header('Batch Processing','Validated, resource-bounded CSV inference through the existing model API')
 uploaded=st.file_uploader('Upload UTF-8 CSV containing text and optionally word',type='csv')
 mode=st.selectbox('Inference method',['hybrid','rule','dictionary','neural'])
 include_lid=st.checkbox('Also perform LID')
 if uploaded:
  raw=uploaded.getvalue()
  if len(raw)>5_000_000:st.error('5 MB file limit')
  else:
   try:
    rows=list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
    if not rows or 'text' not in rows[0] or len(rows)>250:st.error('Requires text column and 1–250 rows')
    else:
     st.dataframe(pd.DataFrame(rows).head(10),hide_index=True)
     if st.button('Run batch inference',type='primary'):
      results=[];progress=st.progress(0)
      for i,row in enumerate(rows):
       word=(row.get('word') or '').strip() or None
       if not word:
        matches=[m.group().lower() for m in re.finditer(r'\b\w+\b',row['text']) if m.group().lower() in inventory()]
        word=matches[0] if matches else None
       try:
        if not word:raise ValueError('No supported target detected')
        prediction=call('predict',{'text':row['text'],'word':word,'method':mode})
        record={**row,'prediction':json.dumps(prediction,ensure_ascii=False),'error':''}
        if include_lid:record['lid']=json.dumps(call('lid',{'text':row['text']}),ensure_ascii=False)
       except (ServiceError,ValueError) as e:record={**row,'prediction':'','error':str(e)}
       results.append(record);progress.progress((i+1)/len(rows))
      buf=io.StringIO();writer=csv.DictWriter(buf,fieldnames=list(dict.fromkeys(k for row in results for k in row)));writer.writeheader();writer.writerows(results)
      st.dataframe(pd.DataFrame(results),width='stretch');st.download_button('Download results CSV',buf.getvalue(),'senseforge_batch.csv','text/csv')
   except (UnicodeError,csv.Error) as e:st.error(f'Invalid CSV: {e}')
elif page==PAGES[10]:
 header('Annotation Studio','Human-in-the-loop review using existing candidate and annotation endpoints')
 data=api('candidates',params={'offset':0,'limit':50})
 items=data.get('items',[]) if data else []
 if not items:st.info('No active annotation candidates found. Restore artifacts/candidates.jsonl from the original extraction workflow.')
 else:
  idx=st.number_input('Queue position',min_value=0,max_value=len(items)-1,value=0)
  item=items[idx];st.json(item)
  word=item.get('word') or item.get('lemma')
  senses=inventory().get(str(word).lower(),{}).get('senses',[])
  if not senses:st.warning('No inventory senses available for this candidate.')
  else:
   sense=st.selectbox('Sense label',[s['id'] for s in senses]);annotator=st.text_input('Annotator identity');status=st.selectbox('Review status',['reviewed','pending','disputed'])
   if st.button('Save annotation',type='primary'):
    if not annotator.strip():st.error('Annotator identity required')
    else:
     response=api('annotations',{'item_id':str(item.get('item_id') or item.get('id') or ''),'word':str(word),'sense_id':sense,'annotator':annotator,'status':status})
     if response:st.success('Annotation saved through backend.')
 records=api('annotations')
 if records:download(records,'senseforge_annotations.json')
else:
 header('Experiments & Research Registry','20-notebook research lineage, checkpoints and reproducibility')
 notebooks=sorted((ROOT/'notebooks').glob('*.ipynb'))
 st.dataframe(pd.DataFrame([{'Notebook':p.name,'Size (KB)':round(p.stat().st_size/1024,1)} for p in notebooks]),hide_index=True,width='stretch')
 st.subheader('Available checkpoint and artifact directories')
 if ART.exists():st.dataframe(pd.DataFrame([{'Path':str(p.relative_to(ART)),'Files':sum(1 for f in p.rglob('*') if f.is_file())} for p in ART.iterdir() if p.is_dir()]),hide_index=True,width='stretch')
 show_artifacts('senseforge_end_to_end');show_artifacts('senseforge_final')
 st.caption('Missing model weights in a handoff package cannot be used for inference. Restore original checkpoints locally.')
