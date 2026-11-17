"""Real PyTorch training, validation, early stopping and checkpointing."""
import json, random
from pathlib import Path
import numpy as np

def seed_all(seed=42):
    import torch
    random.seed(seed);np.random.seed(seed);torch.manual_seed(seed)

def device_auto():
    import torch
    return torch.device('mps' if torch.backends.mps.is_available() else 'cuda' if torch.cuda.is_available() else 'cpu')

def fit(model,train_loader,val_loader,out,epochs=8,lr=2e-5,patience=2):
    import torch
    from .neural import run_epoch
    from sklearn.metrics import accuracy_score, f1_score
    out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
    device=device_auto();model.to(device)
    opt=torch.optim.AdamW(model.parameters(),lr=lr)
    best=float('inf');wait=0;history=[]
    for epoch in range(epochs):
        train_loss=run_epoch(model,train_loader,device,opt)
        val_loss=run_epoch(model,val_loader,device)
        model.eval();pred=[];truth=[]
        with torch.no_grad():
            for batch in val_loader:
                batch={k:v.to(device) for k,v in batch.items()}
                _,logits=model(**batch)
                pred.extend(logits.argmax(-1).cpu().tolist());truth.extend(batch['labels'].cpu().tolist())
        metrics={'epoch':epoch+1,'train_loss':train_loss,'val_loss':val_loss,'accuracy':accuracy_score(truth,pred) if truth else None,'macro_f1':f1_score(truth,pred,average='macro',zero_division=0) if truth else None}
        history.append(metrics)
        if val_loss<best-1e-5:
            best=val_loss;wait=0;torch.save({'state_dict':model.state_dict(),'epoch':epoch+1},out)
        else:
            wait+=1
            if wait>=patience:break
    out.with_suffix('.history.json').write_text(json.dumps(history,indent=2))
    state=torch.load(out,map_location=device,weights_only=True)
    model.load_state_dict(state['state_dict']);model.eval()
    return history

def training_plot(history,path):
    import matplotlib.pyplot as plt
    fig,ax=plt.subplots();ax.plot([r['epoch'] for r in history],[r['train_loss'] for r in history],label='train');ax.plot([r['epoch'] for r in history],[r['val_loss'] for r in history],label='validation');ax.legend();ax.set_xlabel('epoch');ax.set_ylabel('loss');fig.savefig(path);plt.close(fig)
