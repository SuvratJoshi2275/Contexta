import requests
from config import API
class ServiceError(RuntimeError):pass
def call(path,payload=None,params=None):
 try:
  r=requests.request('POST' if payload is not None else 'GET',API+'/api/'+path,json=payload,params=params,timeout=180)
  r.raise_for_status();return r.json()
 except requests.RequestException as e:
  detail=getattr(e.response,'text','') if getattr(e,'response',None) is not None else ''
  raise ServiceError(f'{e}. {detail[:400]}') from e
