import json,re,unicodedata,subprocess
import os; HERE=os.path.dirname(os.path.abspath(__file__))
F=json.load(open(HERE+'/films.json')); P=json.load(open(HERE+'/people.json'))
facts,rel,cur=P['facts'],P['rel'],P['cur']
allq=set(facts)
# names: curated names win; then Wikidata labels, disambiguated on collision
q2n={q:n for n,q in cur.items()}
used=set(q2n.values()); 
curated_names=json.load(open(HERE+'/guest-names.json'))
for q,f in sorted(facts.items(),key=lambda kv:-(kv[1]['cast']+kv[1]['crew'])):
    if q in q2n: continue
    n=f['n']
    if re.fullmatch(r'Q\d+',n): continue
    if n in used and n not in curated_names:
        n=f"{n} ({f.get('born','')})".replace(' ()','')
        if n in used: continue
    q2n[q]=n; used.add(n)   # a label equal to an unmatched curated name is that same person
norm=lambda t:re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',t).lower())
# existing hand-built films, so Wikidata never duplicates them
js=open(HERE+'/../../assets/movies.js').read()
have={(norm(t),int(y)) for t,y in re.findall(r"\['[^']*','((?:[^'\\]|\\.)*)',(\d{4})",js)}
def dup(t,y): return any((norm(t),yy) in have for yy in (y-1,y,y+1))
score=lambda q:facts[q]['cast']+facts[q]['crew']
films=[];merge={}
for fid,f in F.items():
    cast=[q for q in f['c'].get('cast',{}) if q in q2n]; cast=sorted(cast,key=score,reverse=True)[:6]
    crew=[[q2n[q],r] for r in ('director','producer','composer') for q in f['c'].get(r,{}) if q in q2n]
    if len(cast)+len(crew)<2 or not cast: continue
    row=[fid,f['t'],f['y'],{'cast':[q2n[q] for q in cast],'crew':crew,'wd':1}]
    if dup(f['t'],f['y']): merge[norm(f['t'])+str(f['y'])]=row[3]; continue
    films.append(row)
# family
seen=set();fam=[]
for a,prop,b,bl,s,e in rel:
    if a not in q2n or b not in q2n or a==b: continue
    A,B=q2n[a],q2n[b];k=tuple(sorted([A,B]))
    if k in seen: continue
    seen.add(k)
    if prop=='P26':
        t='d' if e else 'm'; d=('married'+(' '+s if s else '')+(', ended '+e if e else ''))
        fam.append([A,B,t,d,int(s) if s else None])
    elif prop in('P22','P25'): fam.append([B,A,'f','father' if prop=='P22' else 'mother',None])
    elif prop=='P40': fam.append([A,B,'f','parent and child',None])
    else: fam.append([A,B,'f','siblings',None])
img={}
for q,f in facts.items():
    if q in q2n and 'img' in f: img[q2n[q]]=f['img'].replace('http://','https://')
ids={n:q for q,n in q2n.items()}
out='// built by tools/sync-wikidata (Wikidata, CC0). Films, families and photos; the gossip stays hand-checked in site.js.\n'
out+='(function(){const W='+json.dumps({'films':films,'merge':merge,'fam':fam},ensure_ascii=False,separators=(',',':'))+';\n'
out+="""const norm=t=>t.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const M=window.MOVIES||(window.MOVIES=[]);
M.forEach(r=>{for(const y of [r[2]-1,r[2],r[2]+1]){const x=W.merge[norm(r[1])+y];if(x){r[3].cast=r[3].cast||[];x.cast.forEach(n=>{if(!r[3].cast.includes(n)&&!(r[3].special||[]).includes(n))r[3].cast.push(n)});break}}});
W.films.forEach(r=>M.push(r));window.WD_FAM=W.fam;})();
"""
open(HERE+'/../../assets/wd.js','w').write(out)
open(HERE+'/../../assets/wd-meta.js','w').write('// Wikidata ids and Commons photos for the build; not loaded by pages\nwindow.WD_IDS='+json.dumps(ids,ensure_ascii=False)+';\nwindow.WD_IMG='+json.dumps(img,ensure_ascii=False)+';\n')
print('people named',len(q2n),'new films',len(films),'merged',len(merge),'family edges',len(fam),'photos',len(img))
