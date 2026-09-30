"""Check generated public URLs, local links, anchors and schema before deployment."""
from pathlib import Path
import html
from html.parser import HTMLParser
import re,json,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.ids=[];self.links=[];self.feed(text)
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if 'id' in attrs:self.ids.append(attrs['id'])
  for key in ('href','src'):
   if key in attrs:self.links.append(attrs[key])
pages={p.name:(p.read_text(),Page(p.read_text())) for p in ROOT.glob('*.html')}
errors=[]
for name,(text,page) in pages.items():
 if len(page.ids)!=len(set(page.ids)):errors.append(name+': duplicate IDs')
 for url in page.links:
  if url.startswith(('https:','http:','data:','mailto:')):continue
  target=url.split('?')[0].split('#')[0] or name
  if not (ROOT/target).exists():errors.append(name+': missing '+target)
  if '#' in url and target in pages and url.split('#',1)[1] not in pages[target][1].ids:errors.append(name+': missing anchor '+url)
 for raw in re.findall(r'<script type="application/ld\+json">(.*?)</script>',text,re.S):
  data=json.loads(raw)
  for item in data.get('@graph',[data]):
   if item.get('@type')=='Recipe':
    if not item.get('author'):errors.append(name+': missing recipe content attribution')
    for ingredient in item['recipeIngredient']:
     if ingredient not in html.unescape(text):errors.append(name+': ingredient schema differs from visible content')
    for step in item['recipeInstructions']:
     anchor=step['url'].split('#')[-1]
     if anchor not in page.ids:errors.append(name+': invalid recipe step '+anchor)
urls=[e.text for e in ET.parse(ROOT/'sitemap.xml').getroot().iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
if len(urls)!=len(set(urls)):errors.append('Duplicate sitemap URLs')
titles=set()
for url in urls:
 name=url.rsplit('/',1)[-1];text,page=pages[name]
 if 'noindex' in text:errors.append(name+': noindex in sitemap')
 title=re.search(r'<title>(.*?)</title>',text,re.S)[1]
 if title in titles:errors.append(name+': duplicate public title')
 titles.add(title)
 if len(re.findall(r'<h1\b',text))!=1:errors.append(name+': expected one main heading')
 if not re.search(r'<meta name="description" content="[^"]+">',text):errors.append(name+': missing description')
 if '<link rel="canonical" href="'+url+'">' not in text:errors.append(name+': canonical mismatch')
assert not errors,'\n'.join(errors)
print(f'Checked {len(urls)} public pages: links, anchors, canonicals and JSON-LD passed.')
