"""Token classifier trainer using validation-only model selection."""
from pathlib import Path
import json
from .training import device_auto

def fit_lid(model,train_loader,val_loader,out,epochs=5,patience=2,lr=2e-5):
    import torch
    from sklearn.metrics import f1_score,accuracy_score
    out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
    device=device_auto();model.to(device);optimizer=torch.optim.AdamW(model.parameters(),lr=lr)
    best=float('inf');wait=0;history=[]
    for epoch in range(epochs):
        losses=[]
        for phase,loader in [('train',train_loader),('val',val_loader)]:
            model.train(phase=='train');total=0;n=0;truth=[];pred=[]
            for batch in loader:
                batch={k:v.to(device) for k,v in batch.items()}
                with torch.set_grad_enabled(phase=='train'):
                    result=model(**batch);loss=result.loss
                    if phase=='train':optimizer.zero_grad();loss.backward();optimizer.step()
                total+=loss.item();n+=1
                if phase=='val':
                    mask=batch['labels']!=-100
                    truth.extend(batch['labels'][mask].cpu().tolist());pred.extend(result.logits.argmax(-1)[mask].cpu().tolist())
            losses.append(total/max(n,1))
        row={'epoch':epoch+1,'train_loss':losses[0],'val_loss':losses[1],'accuracy':accuracy_score(truth,pred) if truth else None,'macro_f1':f1_score(truth,pred,average='macro',zero_division=0) if truth else None};history.append(row)
        if losses[1]<best-1e-5:best=losses[1];wait=0;model.save_pretrained(out)
        else:
            wait+=1
            if wait>=patience:break
    (out/'history.json').write_text(json.dumps(history,indent=2));return history
