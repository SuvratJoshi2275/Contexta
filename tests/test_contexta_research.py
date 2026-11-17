import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from senseforge.research import parse_annotation,comi_agreement,grouped_split,digest,candidates,infer_direction
from senseforge.benchmark import route

def test_annotation_parser():
    assert parse_annotation("[{'key':'hello','value':'en'}]")==[('hello','en')]
    assert parse_annotation('not a list') is None

def test_agreement(tmp_path):
    import csv
    p=tmp_path/'comi.csv'
    example="[{'key':'hi','value':'en'}]"
    other="[{'key':'hi','value':'hi'}]"
    with p.open('w',newline='') as f:
        w=csv.writer(f);w.writerow([f'Annotated by: Annotator {i}' for i in range(1,4)])
        w.writerow([example,example,other])
    r=comi_agreement(p)
    assert r['counts']['majority']==1

def test_group_split_no_leakage():
    rows=[{'text':f'sentence {i//2}','id':str(i)} for i in range(50)]
    parts=grouped_split(rows);sets=[{digest(r['text']) for r in x} for x in parts.values()]
    assert not (sets[0]&sets[1] or sets[0]&sets[2] or sets[1]&sets[2])

def test_direction_unknown():
    assert infer_direction([{'src':'hello','tgt':'namaste'}])=='unknown'

def test_candidate_unlabeled():
    from senseforge.core import INVENTORY
    word=next(iter(INVENTORY));r=list(candidates([(f'Look at {word} now','hindi')],'fixture'))
    assert r and all(x['label'] is None for x in r)
