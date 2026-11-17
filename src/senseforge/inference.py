"""Load trained target-span WSD checkpoint and infer with the same alignment as training."""
import json,re
from pathlib import Path

def load_wsd(checkpoint,model_name='xlm-roberta-base',max_length=160):
    import torch
    from transformers import AutoTokenizer
    from .neural import TargetClassifier
    from .training import device_auto
    checkpoint=Path(checkpoint)
    labels=json.loads(checkpoint.with_suffix('.labels.json').read_text())
    tokenizer=AutoTokenizer.from_pretrained(model_name,use_fast=True)
    model=TargetClassifier(model_name,len(labels))
    device=device_auto()
    state=torch.load(checkpoint,map_location=device,weights_only=True)
    model.load_state_dict(state['state_dict']);model.to(device);model.eval()
    def infer(row):
        match=re.search(r'(?<!\w)'+re.escape(row['word'])+r'(?!\w)',row['text'],re.I)
        if match is None:raise ValueError('Missing target')
        enc=tokenizer(row['text'],return_offsets_mapping=True,max_length=max_length,truncation=True,padding='max_length')
        offsets=enc.pop('offset_mapping')
        mask=[int(a<match.end() and b>match.start()) for a,b in offsets]
        if not any(mask):raise ValueError('Truncated target')
        batch={k:torch.tensor([v],device=device) for k,v in enc.items()}
        batch['target_mask']=torch.tensor([mask],dtype=torch.float32,device=device)
        with torch.no_grad():
            probs=model(**batch).softmax(-1)[0];confidence,index=probs.max(0)
        return labels[index.item()],float(confidence.item())
    return infer
