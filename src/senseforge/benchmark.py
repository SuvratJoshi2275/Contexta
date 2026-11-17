"""Common benchmark and validation-only hybrid threshold tuning."""
from collections import Counter,defaultdict
from .core import predict

def evaluate(rows,predictor):
    from sklearn.metrics import accuracy_score,f1_score,classification_report,confusion_matrix
    truth=[];pred=[];errors=[]
    for row in rows:
        if not row.get('sense_id'):continue
        answer=predictor(row);label=answer['sense_id'];truth.append(row['sense_id']);pred.append(label)
        if label!=row['sense_id']:errors.append({'id':row['id'],'word':row['word'],'gold':row['sense_id'],'pred':label,'trace':answer.get('status')})
    if not truth:raise ValueError('No adjudicated gold examples available')
    labels=sorted(set(truth)|set(pred))
    return {'n':len(truth),'accuracy':accuracy_score(truth,pred),'macro_f1':f1_score(truth,pred,labels=labels,average='macro',zero_division=0),'per_class':classification_report(truth,pred,labels=labels,output_dict=True,zero_division=0),'confusion':{'labels':labels,'matrix':confusion_matrix(truth,pred,labels=labels).tolist()},'errors':errors}

def route(row,neural=None,threshold=.75,method='rule'):
    base=predict(row['text'],row['word'],method=method)
    if neural is None:return base
    label,confidence=neural(row)
    if confidence>=threshold:return {**base,'sense_id':label,'method':'hybrid_neural','status':'neural_above_threshold','confidence':confidence}
    return {**base,'method':'hybrid_fallback','status':'neural_below_threshold','confidence':confidence}

def calibrate(validation,neural,thresholds=(.5,.6,.7,.8,.9,.95)):
    if not validation:raise ValueError('Validation gold required for calibration')
    scores=[(evaluate(validation,lambda r:route(r,neural,t))['macro_f1'],t) for t in thresholds]
    return sorted(scores,key=lambda x:(-x[0],x[1]))[0][1]
