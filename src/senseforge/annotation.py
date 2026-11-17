import sqlite3,datetime
from pathlib import Path
from .core import ROOT,INVENTORY
DB=ROOT/'artifacts/annotations.sqlite3'
def connect():
 DB.parent.mkdir(exist_ok=True)
 con=sqlite3.connect(DB);con.row_factory=sqlite3.Row
 con.execute('CREATE TABLE IF NOT EXISTS annotations (item_id TEXT, annotator TEXT, sense_id TEXT, status TEXT, timestamp TEXT, PRIMARY KEY(item_id,annotator))')
 return con
def save(item_id,word,sense_id,annotator,status='reviewed'):
 if not item_id or not annotator:raise ValueError('Item and annotator required')
 if word not in INVENTORY or sense_id not in [s['id'] for s in INVENTORY[word]['senses']]+['uncertain','other']:raise ValueError('Invalid sense')
 with connect() as con:con.execute('INSERT OR REPLACE INTO annotations VALUES (?,?,?,?,?)',(item_id,annotator,sense_id,status,datetime.datetime.now(datetime.timezone.utc).isoformat()))
def records():
 with connect() as con:return [dict(x) for x in con.execute('SELECT * FROM annotations ORDER BY timestamp DESC')]
def gold():
 from collections import defaultdict
 grouped=defaultdict(list)
 for a in records():
  if a['status']=='reviewed':grouped[a['item_id']].append(a)
 return [{'item_id':k,'sense_id':v[0]['sense_id'],'annotators':[a['annotator'] for a in v]} for k,v in grouped.items() if len({a['annotator'] for a in v})>=2 and len({a['sense_id'] for a in v})==1 and v[0]['sense_id'] not in ('uncertain','other')]

def adjudicate(item_id,word,sense_id,adjudicator):
    """Human adjudication only: explicit adjudicator and valid inventory sense."""
    if sense_id in ('uncertain','other'):raise ValueError('Adjudication requires a defined sense')
    save(item_id,word,sense_id,'adjudicator:'+adjudicator,status='adjudicated')

def adjudicated_gold():
    with connect() as con:
        return [{'item_id':r['item_id'],'sense_id':r['sense_id']} for r in con.execute("SELECT item_id,sense_id FROM annotations WHERE status='adjudicated'")]
