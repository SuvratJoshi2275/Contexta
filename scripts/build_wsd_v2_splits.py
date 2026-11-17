import json
import random
from pathlib import Path
from collections import Counter, defaultdict

ART = Path("artifacts")
OUT = ART / "wsd_v2"
OUT.mkdir(parents=True, exist_ok=True)

WORDS = {"bank", "interest", "plant", "point", "right", "table"}
OLD_WORDS = {"bank", "plant", "table"}
rng = random.Random(42)

def load(name):
    with (ART / name).open(encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]

def norm(text):
    return " ".join(text.casefold().split())

pool = [
    r for r in load("wsd_expanded_train_pool.jsonl")
    if r["target_word"] in WORDS
]

old_val = [
    r for r in load("semcor_validation.jsonl")
    if r["target_word"] in OLD_WORDS
]
old_test = [
    r for r in load("semcor_test.jsonl")
    if r["target_word"] in OLD_WORDS
]

protected = {norm(r["text_en"]) for r in old_val + old_test}
pool = [r for r in pool if norm(r["text_en"]) not in protected]

train, val, test = [], list(old_val), list(old_test)

new_semcor = [
    r for r in pool
    if r["target_word"] not in OLD_WORDS
    and r["source_dataset"] == "semcor_en"
]

groups = defaultdict(list)
for row in new_semcor:
    groups[norm(row["text_en"])].append(row)

group_list = list(groups.values())
rng.shuffle(group_list)

n = len(group_list)
n_val = max(1, round(n * 0.15))
n_test = max(1, round(n * 0.15))

for i, group in enumerate(group_list):
    if i < n_val:
        val.extend(group)
    elif i < n_val + n_test:
        test.extend(group)
    else:
        train.extend(group)

for row in pool:
    if row["target_word"] in OLD_WORDS and row["source_dataset"] == "semcor_en":
        train.append(row)

aux = [
    r for r in pool
    if r["source_dataset"] != "semcor_en"
]

by_sense = defaultdict(list)
for row in aux:
    by_sense[row["sense_id"]].append(row)

for sense, rows in sorted(by_sense.items()):
    examples = [r for r in rows if r["source_dataset"] == "wngt_examples_en"]
    glosses = [r for r in rows if r["source_dataset"] == "wngt_glosses_en"]

    rng.shuffle(glosses)
    train.extend(examples)
    train.extend(glosses[:30])

def save(name, rows):
    path = OUT / f"{name}.jsonl"
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"\n{name}: {len(rows)} records")
    print(dict(sorted(Counter(r["sense_id"] for r in rows).items())))

for name, rows in [("train", train), ("validation", val), ("test", test)]:
    save(name, rows)

sets = [
    {norm(r["text_en"]) for r in rows}
    for rows in (train, val, test)
]

assert not (sets[0] & sets[1])
assert not (sets[0] & sets[2])
assert not (sets[1] & sets[2])

print("\nSentence overlap: 0")
print("Saved to:", OUT)
