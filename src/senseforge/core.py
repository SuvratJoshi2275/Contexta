import json,re,unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
INVENTORY=json.loads((ROOT/'configs/inventory.json').read_text(encoding='utf8'))
def normalize(s):return unicodedata.normalize('NFKC',s).casefold()
def detect(text):
 t=normalize(text)
 return [w for w in INVENTORY if re.search(r'(?<!\w)'+re.escape(w)+r'(?!\w)',t)]
def predict(text,word=None,method='rule'):
 found=detect(text)
 word=(word or (found[0] if found else '')).casefold()
 if word not in INVENTORY:raise ValueError('No supported ambiguous target word found')
 if not re.search(r'(?<!\w)'+re.escape(word)+r'(?!\w)',normalize(text)):raise ValueError('Target word not present in input')
 item=INVENTORY[word];tokens=set(re.findall(r'\w+',normalize(text)));tokens.discard(word)
 scores=[]
 for sense in item['senses']:
  matched=sorted(tokens.intersection(normalize(c) for c in sense['cues']))
  scores.append((len(matched),sense,matched))
 scores.sort(key=lambda x:(-x[0],x[1]['id']))
 if method=='dictionary':chosen=next(s for s in item['senses'] if s['id']==item['default']);matched=[];status='dictionary_default'
 elif scores[0][0]==0 or (len(scores)>1 and scores[0][0]==scores[1][0]):chosen=next(s for s in item['senses'] if s['id']==item['default']);matched=[];status='fallback_ambiguous_or_unmatched'
 else:chosen=scores[0][1];matched=scores[0][2];status='lexical_rule'
 return {'word':word,'sense_id':chosen['id'],'definition':chosen['definition'],'hindi':chosen['hindi'],'method':method,'status':status,'evidence':matched,'alternatives':[{'id':s['id'],'hindi':s['hindi'],'definition':s['definition'],'matched_cues':m} for n,s,m in scores],'confidence':None}
