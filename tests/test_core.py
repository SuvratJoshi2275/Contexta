import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from senseforge.core import INVENTORY,predict,detect
from senseforge.annotation import save,gold
from senseforge.evaluation import evaluate

def test_inventory():
 assert len(INVENTORY)>=30
 for w,item in INVENTORY.items():
  assert len(item['senses'])>=2
  assert item['default'] in [s['id'] for s in item['senses']]
  assert all(s['hindi'] and s['cues'] for s in item['senses'])
def test_detection():assert 'bank' in detect('The bank is open.')
def test_rules():
 assert predict('Money deposited in the bank','bank')['sense_id']=='bank.1'
 assert predict('The river bank is wet','bank')['sense_id']=='bank.2'
def test_dictionary():assert predict('river bank','bank','dictionary')['sense_id']=='bank.1'
def test_no_fake_confidence():assert predict('the bank','bank')['confidence'] is None
def test_invalid():
 import pytest
 with pytest.raises(ValueError):predict('hello','bank')
def test_metrics():
 a=evaluate([{'text':'river bank','word':'bank','sense_id':'bank.2'}]);assert a['accuracy']==1
