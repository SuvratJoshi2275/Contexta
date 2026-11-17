"""Shared deterministic research data utilities; no synthetic gold labels."""
import csv, hashlib, json, re, os, random
from pathlib import Path
from collections import Counter, defaultdict
from .core import INVENTORY
from .data import source_paths

def canonical(text):
    return re.sub(r"\s+", " ", str(text).casefold()).strip()

def digest(text):
    return hashlib.sha256(canonical(text).encode("utf8")).hexdigest()

def reservoir_parquet(path, size=5000, seed=42):
    """Uniform reproducible row sample over ALL batches, O(size) memory."""
    import pyarrow.parquet as pq
    rng=random.Random(seed); sample=[]; total=0
    pf=pq.ParquetFile(path)
    for batch in pf.iter_batches(batch_size=2048):
        for row in batch.to_pylist():
            total+=1
            if len(sample)<size: sample.append(row)
            else:
                j=rng.randrange(total)
                if j<size: sample[j]=row
    return {'total_rows':total,'sample':sample,'columns':pf.schema_arrow.names}

def extract_pair(row, direction=None):
    trans=row.get('translation')
    if isinstance(trans,dict):return trans.get('en'),trans.get('hi')
    if 'en' in row and 'hi' in row:return row['en'],row['hi']
    if direction=='en-hi':return row.get('src'),row.get('tgt')
    if direction=='hi-en':return row.get('tgt'),row.get('src')
    return None,None

def script_fraction(text):
    chars=[c for c in str(text) if c.isalpha()]
    return sum('\u0900'<=c<='\u097f' for c in chars)/max(len(chars),1)

def infer_direction(rows):
    if not rows:return 'unknown'
    a=sum(script_fraction(r.get('src','')) for r in rows)/len(rows)
    b=sum(script_fraction(r.get('tgt','')) for r in rows)/len(rows)
    if a<0.1 and b>0.5:return 'en-hi'
    if b<0.1 and a>0.5:return 'hi-en'
    return 'unknown'  # require explicit override; Romanized Hindi is ambiguous

def parse_annotation(raw):
    """COMI-LINGUA list-of-dicts annotation format, not whitespace tags."""
    import ast
    if isinstance(raw,list): value=raw
    else:
        try:value=json.loads(raw)
        except (TypeError,ValueError):
            try:value=ast.literal_eval(raw)
            except (TypeError,ValueError,SyntaxError):return None
    if not isinstance(value,list):return None
    result=[]
    for item in value:
        if not isinstance(item,dict) or not isinstance(item.get('key'),str) or not isinstance(item.get('value'),str):return None
        result.append((item['key'],item['value'].lower()))
    return result

def comi_agreement(path):
    stats=Counter(); tags=Counter()
    with open(path,encoding='utf-8-sig',newline='') as f:
        for row in csv.DictReader(f):
            stats['sentences']+=1
            cols=[k for k in row if 'annotated by' in k.casefold()]
            parsed=[parse_annotation(row[k]) for k in cols]
            if len(parsed)<2 or any(p is None for p in parsed):stats['invalid_rows']+=1;continue
            tokens=[[x[0] for x in p] for p in parsed]
            if any(t!=tokens[0] for t in tokens[1:]):stats['alignment_errors']+=1;continue
            for idx in range(len(tokens[0])):
                stats['tokens']+=1
                votes=Counter(p[idx][1] for p in parsed)
                if len(votes)==1:stats['unanimous']+=1
                winner,count=votes.most_common(1)[0]
                if count>len(parsed)/2:stats['majority']+=1;tags[winner]+=1
                else:stats['unresolved']+=1
    return {'counts':dict(stats),'majority_tag_counts':dict(tags)}

def protected_hashes(paths, direction=None):
    """Read ALL rows of held-out parquet files; only hashes retained."""
    import pyarrow.parquet as pq
    result=set()
    for path in paths:
        if not Path(path).exists():continue
        for batch in pq.ParquetFile(path).iter_batches(batch_size=2048):
            for row in batch.to_pylist():
                en,hi=extract_pair(row,direction)
                for text in (en,hi):
                    if isinstance(text,str) and text.strip():result.add(digest(text))
    return result

def iter_clean_pairs(path, forbidden, direction=None):
    import pyarrow.parquet as pq
    for batch in pq.ParquetFile(path).iter_batches(batch_size=2048):
        for row in batch.to_pylist():
            en,hi=extract_pair(row,direction)
            if not isinstance(en,str) or not isinstance(hi,str) or not en.strip() or not hi.strip():continue
            if digest(en) in forbidden or digest(hi) in forbidden:continue
            yield en,hi

def candidates(pairs,source,split='train'):
    for en,hi in pairs:
        for word in INVENTORY:
            for m in re.finditer(r'(?<!\w)'+re.escape(word)+r'(?!\w)',en,re.I):
                yield {'id':digest(en+'|'+word+'|'+str(m.start())),'text':en,'hindi_sentence':hi,'word':word,'start':m.start(),'end':m.end(),'source':source,'split':split,'label':None,'label_status':'unlabelled'}

def write_jsonl(path,rows):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True);n=0
    with path.open('w',encoding='utf8') as f:
        for row in rows:f.write(json.dumps(row,ensure_ascii=False)+'\n');n+=1
    return n

def read_jsonl(path):
    if not Path(path).exists():return []
    with open(path,encoding='utf8') as f:return [json.loads(s) for s in f if s.strip()]

def grouped_split(rows,seed=42):
    """Group by normalized sentence; no sentence shared across partitions."""
    groups=defaultdict(list)
    for row in rows:groups[digest(row['text'])].append(row)
    keys=sorted(groups);random.Random(seed).shuffle(keys)
    out={'train':[],'validation':[],'test':[]}
    for i,k in enumerate(keys):
        part='train' if i<.8*len(keys) else ('validation' if i<.9*len(keys) else 'test')
        out[part].extend(groups[k])
    return out
