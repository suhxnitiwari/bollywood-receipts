import json,urllib.request,urllib.parse,time,sys
import os; HERE=os.path.dirname(os.path.abspath(__file__))
UA={'Accept':'application/sparql-results+json','User-Agent':'BollywoodReceiptsBuild/1.0 (portfolio project; suhanitiwari)'}
def sparql(q):
    for t in range(4):
        try:
            r=urllib.request.Request('https://query.wikidata.org/sparql',data=urllib.parse.urlencode({'query':q}).encode(),headers=UA)
            return json.load(urllib.request.urlopen(r,timeout=180))['results']['bindings']
        except Exception as e:
            print('retry',e,file=sys.stderr); time.sleep(5*(t+1))
    raise SystemExit('failed')
films={}
for y0 in range(1930,2030,5):
    q=f"""SELECT ?f ?fl ?d ?role ?p ?pl WHERE {{
      ?f wdt:P31/wdt:P279* wd:Q11424; wdt:P364 wd:Q1568; wdt:P577 ?d. FILTER(YEAR(?d)>={y0} && YEAR(?d)<{y0+5})
      ?f ?prop ?p. VALUES (?prop ?role) {{ (wdt:P161 "cast") (wdt:P57 "director") (wdt:P162 "producer") (wdt:P86 "composer") }}
      ?f rdfs:label ?fl. FILTER(LANG(?fl)="en") ?p rdfs:label ?pl. FILTER(LANG(?pl)="en") }}"""
    rows=sparql(q)
    for b in rows:
        f=b['f']['value'].rsplit('/',1)[1]; p=b['p']['value'].rsplit('/',1)[1]
        e=films.setdefault(f,{'t':b['fl']['value'],'y':int(b['d']['value'][:4]),'c':{}})
        e['y']=min(e['y'],int(b['d']['value'][:4]))
        e['c'].setdefault(b['role']['value'],{})[p]=b['pl']['value']
    print(y0,len(rows),len(films),file=sys.stderr); time.sleep(1)
json.dump(films,open(HERE+'/films.json','w'))
