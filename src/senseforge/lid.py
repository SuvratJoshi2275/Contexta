"""COMI-LINGUA token-level LID dataset with subword masking."""
from torch.utils.data import Dataset
import torch
from .research import parse_annotation
class LIDDataset(Dataset):
    def __init__(self,examples,tokenizer,label_to_id,max_length=128):
        self.examples=examples;self.tokenizer=tokenizer;self.label_to_id=label_to_id;self.max_length=max_length
    def __len__(self):return len(self.examples)
    def __getitem__(self,i):
        tokens,tags=self.examples[i]
        enc=self.tokenizer(tokens,is_split_into_words=True,truncation=True,padding='max_length',max_length=self.max_length)
        word_ids=enc.word_ids();labels=[];previous=None
        for wid in word_ids:
            labels.append(self.label_to_id[tags[wid]] if wid is not None and wid!=previous else -100)
            previous=wid
        return {**{k:torch.tensor(v) for k,v in enc.items()},'labels':torch.tensor(labels)}
def load_examples(csv_path):
    import csv
    out=[]
    with open(csv_path,encoding='utf-8-sig',newline='') as f:
        for row in csv.DictReader(f):
            cols=[k for k in row if 'annotated by' in k.casefold()]
            parsed=[parse_annotation(row[k]) for k in cols]
            if not parsed or any(x is None for x in parsed):continue
            if any([t for t,_ in x]!=[t for t,_ in parsed[0]] for x in parsed):continue
            tokens=[];labels=[]
            from collections import Counter
            for group in zip(*parsed):
                votes=Counter(tag for _,tag in group);label,n=votes.most_common(1)[0]
                if n<=len(group)/2:break
                tokens.append(group[0][0]);labels.append(label)
            if len(tokens)==len(parsed[0]):out.append((tokens,labels))
    return out
