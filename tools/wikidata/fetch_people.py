import json,time,sys
import os; HERE=os.path.dirname(os.path.abspath(__file__))
from urllib import request as UR, parse as UP
from collections import Counter
UA={'Accept':'application/sparql-results+json','User-Agent':'BollywoodReceiptsBuild/1.0 (portfolio project; suhanitiwari)'}
def sparql(q):
    for t in range(5):
        try:
            r=UR.Request('https://query.wikidata.org/sparql',data=UP.urlencode({'query':q}).encode(),headers=UA)
            return json.load(UR.urlopen(r,timeout=180))['results']['bindings']
        except Exception as e: print('retry',e,file=sys.stderr); time.sleep(6*(t+1))
    raise SystemExit('fail')
F=json.load(open(HERE+'/films.json')); cast=Counter(); crew=Counter(); label={}
for f in F.values():
    for r,ps in f['c'].items():
        for p,l in ps.items():
            label[p]=l; (cast if r=='cast' else crew)[p]+=1
sel={p for p,c in cast.items() if c>=5}|{p for p,c in crew.items() if c>=3}
# resolve the curated names to QIDs; prefer the candidate with Hindi credits
M=json.load(open(HERE+'/name-ids.json')); cur={}
for n,v in M.items():
    qs=v['q']; best=max(qs,key=lambda q:(cast[q]+crew[q]))
    cur[n]=best
print('curated resolved',len(cur),'ambiguous kept',sum(1 for v in M.values() if len(v['q'])>1))
allq=sel|set(cur.values())
print('selected regulars',len(sel),'total qids',len(allq))
# facts for everyone selected
facts={}; rel=[]
L=sorted(allq)
for i in range(0,len(L),80):
    vals=' '.join('wd:'+q for q in L[i:i+80])
    q1=f"""SELECT ?p ?pl ?img ?born WHERE {{ VALUES ?p {{ {vals} }}
      OPTIONAL{{?p rdfs:label ?pl FILTER(LANG(?pl)="en")}} OPTIONAL{{?p wdt:P18 ?img}} OPTIONAL{{?p wdt:P569 ?born}} }}"""
    q2=f"""SELECT ?p ?prop ?o ?ol ?s ?e WHERE {{ VALUES ?p {{ {vals} }}
      VALUES (?prop ?claim ?ps) {{ ("P26" p:P26 ps:P26) ("P22" p:P22 ps:P22) ("P25" p:P25 ps:P25) ("P40" p:P40 ps:P40) ("P3373" p:P3373 ps:P3373) }}
      ?p ?claim ?st. ?st ?ps ?o. OPTIONAL{{?o rdfs:label ?ol FILTER(LANG(?ol)="en")}} OPTIONAL{{?st pq:P580 ?s}} OPTIONAL{{?st pq:P582 ?e}} }}"""
    for b in sparql(q1)+sparql(q2):
        p=b['p']['value'].rsplit('/',1)[1]; d=facts.setdefault(p,{'n':label.get(p,p)})
        if 'pl' in b: d['n']=b['pl']['value']
        if 'img' in b: d['img']=b['img']['value']
        if 'born' in b: d['born']=b['born']['value'][:4]
        if 'o' in b:
            rel.append([p,b['prop']['value'],b['o']['value'].rsplit('/',1)[1],b.get('ol',{}).get('value',''),b.get('s',{}).get('value','')[:4],b.get('e',{}).get('value','')[:4]])
    print(i,len(facts),len(rel),file=sys.stderr); time.sleep(1)
for p in facts: facts[p]['cast']=cast[p]; facts[p]['crew']=crew[p]
json.dump({'facts':facts,'rel':rel,'cur':cur},open(HERE+'/people.json','w'))
inn=[r for r in rel if r[2] in allq]
print('relations',len(rel),'inside set',len(inn),'photos',sum(1 for f in facts.values() if 'img' in f),'of',len(facts))
