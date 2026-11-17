import re,torch
from torch import nn
from torch.utils.data import Dataset
class WSDDataset(Dataset):
 def __init__(self,rows,tokenizer,senses,max_length=160):self.rows=rows;self.tokenizer=tokenizer;self.senses=senses;self.max_length=max_length
 def __len__(self):return len(self.rows)
 def __getitem__(self,i):
  row=self.rows[i];m=re.search(r'(?<!\w)'+re.escape(row['word'])+r'(?!\w)',row['text'],re.I)
  if m is None:raise ValueError('Target missing from text')
  enc=self.tokenizer(row['text'],truncation=True,max_length=self.max_length,padding='max_length',return_offsets_mapping=True)
  offsets=enc.pop('offset_mapping');mask=[int(a<m.end() and b>m.start()) for a,b in offsets]
  if not any(mask):raise ValueError('Target truncated or tokenizer alignment failed')
  return {**{k:torch.tensor(v) for k,v in enc.items()},'target_mask':torch.tensor(mask,dtype=torch.float32),'labels':torch.tensor(self.senses.index(row['sense_id']))}
class TargetClassifier(nn.Module):
 def __init__(self,name,num_labels):
  super().__init__();from transformers import AutoModel
  self.encoder=AutoModel.from_pretrained(name);self.head=nn.Linear(self.encoder.config.hidden_size,num_labels)
 def forward(self,input_ids,attention_mask,target_mask,labels=None,**kwargs):
  x=self.encoder(input_ids=input_ids,attention_mask=attention_mask).last_hidden_state
  z=(x*target_mask.unsqueeze(-1)).sum(1)/target_mask.sum(1).clamp(min=1).unsqueeze(-1)
  logits=self.head(z);return (nn.functional.cross_entropy(logits,labels),logits) if labels is not None else logits
def run_epoch(model,loader,device,optimizer=None):
 model.train(optimizer is not None);total=0;n=0
 for batch in loader:
  batch={k:v.to(device) for k,v in batch.items()}
  with torch.set_grad_enabled(optimizer is not None):
   loss,_=model(**batch)
   if optimizer is not None:optimizer.zero_grad();loss.backward();optimizer.step()
  total+=loss.item();n+=1
 return total/max(n,1)
