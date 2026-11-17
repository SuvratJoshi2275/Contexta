import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from backend.main import app
c=TestClient(app)
def test_health():assert c.get('/api/health').json()['inventory_words']>=30
def test_predict():assert c.post('/api/predict',json={'text':'river bank','word':'bank'}).status_code==200
def test_neural_unavailable():assert c.post('/api/predict',json={'text':'river bank','word':'bank','method':'neural'}).status_code==409
def test_batch():
 r=c.post('/api/batch',files={'file':('a.csv',b'text,word\nriver bank,bank\n','text/csv')});assert r.status_code==200
