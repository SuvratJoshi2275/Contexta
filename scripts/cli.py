import sys,json,argparse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'src'))
from senseforge.data import audit,extract
from senseforge.models import train_lid,train_supervised
from senseforge.evaluation import evaluate
p=argparse.ArgumentParser();p.add_argument('action',choices=['audit','extract','lid','wsd','evaluate']);p.add_argument('--train');p.add_argument('--validation');p.add_argument('--gold');p.add_argument('--method',default='rule');p.add_argument('--limit',type=int,default=10000);a=p.parse_args()
if a.action=='audit':out=audit()
elif a.action=='extract':out=extract(a.limit)
elif a.action=='lid':out=train_lid()
elif a.action=='wsd':
 if not a.train or not a.validation:raise SystemExit('Provide --train and --validation gold JSONL')
 out=train_supervised(a.train,a.validation)
else:
 if not a.gold:raise SystemExit('Provide --gold verified JSONL')
 out=evaluate([json.loads(x) for x in open(a.gold)],a.method)
 (ROOT/'reports').mkdir(exist_ok=True);(ROOT/f'reports/{a.method}_metrics.json').write_text(json.dumps(out,indent=2))
print(json.dumps(out,ensure_ascii=False,indent=2))
