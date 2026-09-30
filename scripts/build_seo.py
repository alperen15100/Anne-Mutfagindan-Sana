"""Regenerate crawlable recipe/category pages after editing data.js. No dependencies."""
from pathlib import Path
import re, json, html, unicodedata
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://alperen15100.github.io/Anne-Mutfagindan-Sana/'
NAME = 'Anne Mutfağından Sana'
recipes = json.loads((ROOT/'data.js').read_text().split('=',1)[1].strip().rstrip(';'))
esc = lambda s: html.escape(str(s), quote=True)
def slug(s):
    s=s.replace('İ','i').replace('I','ı').lower().translate(str.maketrans('ığüşıöç','igus ioc'.replace(' ','')))
    return re.sub(r'[^a-z0-9]+','-',s).strip('-')
def rurl(r): return 'tarif-'+r['id']+'.html'
def curl(c): return 'kategori-'+slug(c)+'.html'
cats = list(dict.fromkeys(r['category'] for r in recipes))
def fill(doc,id,content):
    opening=re.search(r'<(\w+)\b[^>]*\bid="'+id+r'"[^>]*>',doc)
    if not opening: return doc
    tag=opening[1];depth=1
    for token in re.finditer(r'</?'+tag+r'\b[^>]*>',doc[opening.end():]):
        depth+=-1 if token[0].startswith('</') else 1
        if depth==0:
            end=opening.end()+token.start()
            return doc[:opening.end()]+content+doc[end:]
    raise ValueError('Unclosed element '+id)
def structured(data):
    return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False).replace('</','<\\/')+'</script>'
def head(doc,path,title,desc,image='assets/recipes/mercimek-corbasi.jpg',schema=None,noindex=False):
    doc=re.sub(r'<title>.*?</title>','<title>'+esc(title)+'</title>',doc,flags=re.S)
    doc=re.sub(r'\s*<meta name="description"[^>]*>','',doc)
    doc=re.sub(r'\s*<!-- SEO:START -->.*?<!-- SEO:END -->\s*','',doc,flags=re.S)
    block='\n<!-- SEO:START -->\n'+f'<meta name="description" content="{esc(desc)}">\n<link rel="canonical" href="{BASE+path}">\n<meta name="robots" content="'+('noindex,follow' if noindex else 'index,follow,max-image-preview:large')+'">\n'
    for prop,val in [('og:type','article' if path.startswith('tarif-') else 'website'),('og:locale','tr_TR'),('og:site_name',NAME),('og:title',title),('og:description',desc),('og:url',BASE+path),('og:image',BASE+image),('og:image:alt',title)]:
        block+=f'<meta property="{prop}" content="{esc(val)}">\n'
    block+='<meta name="twitter:card" content="summary_large_image">\n'
    if schema: block+=structured(schema)+'\n'
    return doc.replace('</head>',block+'<!-- SEO:END -->\n</head>')
def common(doc):
    doc=doc.replace('?v=10','?v=12').replace('?v=11','?v=12').replace('?v=12','?v=13')
    doc=doc.replace('kategori-hamur-i-sleri.html','kategori-hamur-isleri.html')
    from urllib.parse import unquote
    doc=re.sub(r'kategori\.html\?cat=([^"<>]+)',lambda m:curl(unquote(m[1])) if unquote(m[1]) in cats else m[0],doc)
    for c in cats:
        doc=doc.replace('kategori.html?cat='+c,curl(c)).replace('kategori.html?cat='+__import__('urllib.parse',fromlist=['quote']).quote(c),curl(c))
    doc=re.sub(r'<div class="footer-note">.*?</div>','<div class="footer-note">Ev kokan tarifler, saklanacak anılar.</div>',doc)
    if 'href="rehberler.html"' not in doc:
        doc=doc.replace('<div class="footer-links">','<div class="footer-links"><a href="rehberler.html">Mutfak Rehberi</a><a href="hakkimizda.html">Hakkımızda</a><a href="gizlilik.html">Gizlilik</a>')
    if 'href="mutfakta-ne-var.html"' not in doc:
        doc=doc.replace('<a data-nav="defterim"', '<a href="mutfakta-ne-var.html">Ne Pişirsem?</a><a href="menuler.html">Menüler</a><a data-nav="defterim"')
    if 'href="alisveris-listem.html"' not in doc:
        doc=doc.replace('<div class="footer-links">','<div class="footer-links"><a href="alisveris-listem.html">Alışveriş Listem</a><a href="koleksiyonlar.html">Koleksiyonlar</a>')
    if 'src="kitchen.js' not in doc:
        doc=doc.replace('</body>','<script src="kitchen.js?v=13"></script>\n</body>')
    return doc
def card(r):
    return f'<article class="recipe-card"><a class="recipe-card-media" href="{rurl(r)}"><img class="dish-art card-art" src="assets/recipes/{r["id"]}.jpg" alt="{esc(r["title"])}" width="900" height="700" loading="lazy" decoding="async"></a><div class="recipe-card-copy"><div class="eyebrow">{esc(r["category"])}</div><a class="recipe-card-title" href="{rurl(r)}">{esc(r["title"])}</a><p>{esc(r["desc"])}</p><div class="recipe-card-meta"><span>{esc(r["time"])}</span><span>{esc(r["difficulty"])}</span></div></div><button class="heart-btn" data-heart="{r["id"]}" aria-label="Defterime ekle" aria-pressed="false">♡</button></article>'
def crumbs(items):
    return {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':i+1,'name':n,'item':BASE+p} for i,(n,p) in enumerate(items)]}
def trail(items):
    return '<nav class="breadcrumbs" aria-label="Sayfa yolu">'+' <span aria-hidden="true">›</span> '.join(f'<a href="{p}">{esc(n)}</a>' for n,p in items)+'</nav>'
recipe_template=common((ROOT/'tarif.html').read_text())
category_template=common((ROOT/'kategori.html').read_text())
pages=[]
for r in recipes:
    path=rurl(r); doc=recipe_template.replace('data-page="tarif"',f'data-page="tarif" data-recipe="{r["id"]}"')
    for id,key in [('detailTitle','title'),('detailCategory','category'),('detailDesc','desc'),('detailTime','time'),('detailServings','servings'),('detailDifficulty','difficulty'),('tipText','tip'),('noteText','note')]: doc=fill(doc,id,esc(r[key]))
    doc=fill(doc,'detailArt',f'<img class="detail-photo" src="assets/recipes/{r["id"]}.jpg" alt="{esc(r["title"])}" width="900" height="700" fetchpriority="high">')
    doc=fill(doc,'ingredients',''.join('<label class="ingredient"><input type="checkbox"><span>'+esc(i)+'</span></label>' for i in r['ingredients']))
    doc=fill(doc,'steps',''.join(f'<div class="step-row"><div class="step-no">{i+1}</div><p>{esc(x)}</p></div>' for i,x in enumerate(r['steps'])))
    related=[x for x in recipes if x['id']!=r['id'] and x['category']==r['category']][:3]
    doc=fill(doc,'relatedGrid',''.join(card(x) for x in (related or recipes[:3])))
    items=[('Ana Sayfa','index.html'),(r['category'],curl(r['category'])),(r['title'],path)]
    doc=doc.replace('<section class="detail-top">',trail(items)+'<section class="detail-top">')
    doc=doc.replace('<h2>Yapılışı</h2>','<h2 id="yapilis">Yapılışı</h2>')
    doc=doc.replace('<div class="actions">','<div class="actions"><a class="btn" href="#yapilis">Yapılışa Geç ↓</a>',1)
    faq=[(r['title']+' kaç kişilik?',r['servings']+' olarak hazırlanır. Malzemeler bu miktara göre listelenmiştir.'),(r['title']+' ne kadar sürer?','Tarifte belirtilen yaklaşık süre '+r['time']+'. Süre, hazırlık hızına ve kullanılan ekipmana göre değişebilir.'),(r['title']+' için püf noktası nedir?',r['tip'])]
    answers='<section class="recipe-panel recipe-faq"><h2>Tarifle ilgili kısa cevaplar</h2>'+''.join('<details><summary>'+esc(q)+'</summary><p>'+esc(a)+'</p></details>' for q,a in faq)+'<p class="content-note">Görsel yapay zekâ ile oluşturulmuş bir sunum örneğidir. Kendi yemeğinizin görünümü farklı olabilir.</p></section>'
    doc=doc.replace('<section class="related-section">',answers+'<section class="related-section">')
    minutes=sum(int(n)*(60 if unit=='saat' else 1) for n,unit in re.findall(r'(\d+)\s*(dk|saat)',r['time']))
    schema={'@context':'https://schema.org','@graph':[{'@type':'Recipe','@id':BASE+path+'#recipe','url':BASE+path,'name':r['title'],'description':r['desc'],'image':[BASE+'assets/recipes/'+r['id']+'.jpg'],'totalTime':'PT'+str(minutes)+'M','recipeYield':r['servings'],'recipeCategory':r['category'],'recipeCuisine':'Türk mutfağı','recipeIngredient':r['ingredients'],'recipeInstructions':[{'@type':'HowToStep','position':i+1,'text':x,'url':BASE+path+'#yapilis'} for i,x in enumerate(r['steps'])],'inLanguage':'tr-TR'},crumbs(items)]}
    doc=head(doc,path,r['title']+' Tarifi: Malzemeler ve Yapılışı | '+NAME,r['desc']+' '+r['time']+' · '+r['servings']+'. Ölçüler, adım adım yapılış, püf noktası ve PDF tarifi.','assets/recipes/'+r['id']+'.jpg',schema)
    (ROOT/path).write_text(doc);pages.append(path)
for c in [None]+cats:
    path=curl(c) if c else 'kategori.html'; group=[r for r in recipes if not c or r['category']==c]
    title=(c or 'Tüm Tarifler');doc=category_template
    if c:doc=doc.replace('data-page="kategori"',f'data-page="kategori" data-category="{esc(c)}"')
    doc=fill(doc,'archiveTitle',esc(title));doc=fill(doc,'archiveSub',str(len(group))+' tarif · Ölçüler, yapılış ve PDF indirme')
    doc=fill(doc,'archiveGrid',''.join(card(r) for r in group))
    doc=fill(doc,'categoryPills','<a class="filter-pill" href="kategori.html">Tümü</a>'+''.join(f'<a class="filter-pill" href="{curl(x)}">{esc(x)}</a>' for x in cats))
    schema={'@context':'https://schema.org','@type':'ItemList','name':title,'itemListElement':[{'@type':'ListItem','position':i+1,'url':BASE+rurl(r)} for i,r in enumerate(group)]}
    doc=head(doc,path,title+' | '+NAME,title+' için ev usulü yemek fikirleri. Malzeme listeleri, adım adım tarifler ve kişisel PDF tarif defteri.',schema=schema)
    (ROOT/path).write_text(doc);pages.append(path)
home=common((ROOT/'index.html').read_text())
home=fill(home,'popularGrid',''.join(card(r) for r in recipes[:6]))
home=fill(home,'newRecipesGrid',''.join(card(r) for r in recipes[15:21]))
home=home.replace('Ev kokan, denenmiş ve aile sofralarından ilham alan Türk mutfağı tarifleri.','Ev usulü Türk mutfağı tarifleri, açık ölçüler ve adım adım yapılış.')
home=re.sub(r'<section class="section (?:guide-discovery|kitchen-discovery)">.*?</section>','',home,flags=re.S)
home=home.replace('</main>','<section class="section guide-discovery"><div class="container notebook-cta-copy"><p class="kicker">Mutfakta işini kolaylaştır</p><h2>Ölçülerden sofra planına</h2><p>Bardak ölçülerini öğren, birbiriyle uyumlu tarifleri seç ve kendi PDF defterini hazırla.</p><a class="btn primary" href="rehberler.html">Mutfak Rehberini Aç →</a></div></section></main>')
home=head(home,'index.html',NAME+' | Ev Usulü Yemek Tarifleri ve PDF Defteri','30 ev usulü yemek tarifi: malzemeler, adım adım yapılış ve püf noktaları. Favorilerini sakla, kişisel tarif defterini PDF indir.',schema={'@context':'https://schema.org','@type':'WebSite','@id':BASE+'#website','name':NAME,'url':BASE+'index.html','inLanguage':'tr-TR'})
(ROOT/'index.html').write_text(home);pages.append('index.html')
notebook=common((ROOT/'defterim.html').read_text())
(ROOT/'defterim.html').write_text(head(notebook,'defterim.html','Benim Tarif Defterim | '+NAME,'Favori tariflerini bir araya getir ve kişisel tarif kitabını PDF indir.',noindex=True))
legacy=common((ROOT/'tarif.html').read_text())
(ROOT/'tarif.html').write_text(head(legacy,'tarif.html','Tarif Seç | '+NAME,'Ev usulü tariflerimizi tarif arşivinden keşfet.',noindex=True))
# Informational pages use the site's existing header/footer and CSS.
header=re.search(r'<header.*?</header>',home,re.S)[0];footer=re.search(r'<footer.*?</footer>',home,re.S)[0]
def article(path,title,desc,content):
    doc='<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title></title><link rel="stylesheet" href="styles.css?v=11"><link rel="stylesheet" href="redesign.css?v=11"></head><body data-page="guide">'+header+'<main class="section"><article class="container reading-page">'+trail([('Ana Sayfa','index.html'),(title,path)])+'<p class="kicker">Anne Mutfağından Sana</p><h1>'+esc(title)+'</h1><p class="reading-lead">'+esc(desc)+'</p>'+content+'</article></main>'+footer+'<div id="toast" class="toast" role="status"></div><script src="data.js?v=11"></script><script src="app.js?v=11"></script></body></html>'
    (ROOT/path).write_text(head(common(doc),path,title+' | '+NAME,desc,schema={'@context':'https://schema.org','@type':'WebPage','name':title,'url':BASE+path,'inLanguage':'tr-TR'}));pages.append(path)
article('olcu-rehberi.html','Mutfak Ölçüleri: Su Bardağı ve Çay Bardağı','Bu sitede bir su bardağı 200 ml, bir çay bardağı 100 ml olarak kullanılır. Bardak hacmi ile malzemenin ağırlığı aynı şey değildir.','<h2>Tariflerde hangi ölçü kullanılıyor?</h2><table><thead><tr><th>Ölçü</th><th>Hacim</th></tr></thead><tbody><tr><td>1 su bardağı</td><td>200 ml</td></tr><tr><td>Yarım su bardağı</td><td>100 ml</td></tr><tr><td>1 çay bardağı</td><td>100 ml</td></tr><tr><td>Yarım çay bardağı</td><td>50 ml</td></tr></tbody></table><h2>200 ml un, 200 gram un mu?</h2><p>Hayır. Mililitre hacim, gram ağırlık ölçüsüdür. Un, şeker ve yağ aynı bardağı doldursa da aynı ağırlıkta olmaz. Hassas tariflerde tarifin verdiği gram ölçüsünü tartıyla ölçmek daha tutarlı sonuç verir.</p><h2>Malzemeyi nasıl doldurmalı?</h2><p>Kuru malzemeleri bardakta sıkıştırmadan ölç. Tarif özellikle tepeleme demiyorsa üst yüzeyi düzleştir. Evdeki bardaklar farklı hacimlerde olabilir; ölçü kabıyla bardağının kapasitesini bir kez kontrol et.</p><h2>Porsiyon sayısı değişirse</h2><p>4 kişilik bir tarifi 8 kişilik hazırlarken malzemeleri iki katına çıkarabilirsin. Pişirme süresi aynı oranda artmaz; tencerenin veya tepsinin boyutunu ve tarifteki kıvam işaretlerini dikkate al.</p><p><a href="tarif-krep.html">Krep tarifinde ölçüleri kullan →</a></p>')
article('sofra-planlama.html','Bugün Ne Pişirsem? Üç Ev Usulü Menü','Ana yemek, yan yemek ve tamamlayıcı tarifleri bir araya getiren üç pratik sofra fikri.','<h2>Bakliyat sofrası</h2><p><a href="tarif-kuru-fasulye.html">Kuru fasulye</a>, <a href="tarif-pirinc-pilavi.html">pirinç pilavı</a> ve <a href="tarif-cacik.html">cacık</a>. Bakliyat tarifindeki ön hazırlığı bir önceki gün planla. Pilavı ana yemeğin son aşamasında başlat.</p><h2>Tavuklu akşam yemeği</h2><p><a href="tarif-tavuk-sote.html">Tavuk sote</a>, <a href="tarif-firinda-sutlu-patates.html">fırında sütlü patates</a> ve <a href="tarif-havuc-tarator.html">havuç tarator</a>. Önce fırında pişecek tarifi hazırla; kalan tarifleri fırın çalışırken tamamla.</p><h2>Çay saati</h2><p><a href="tarif-patatesli-borek.html">Patatesli börek</a>, <a href="tarif-kisir.html">kısır</a> ve <a href="tarif-mozaik-pasta.html">mozaik pasta</a>. Pastanın dinlenme süresini hesaba katıp önce onu hazırla. Böreği servise yakın pişir.</p><h2>Alışveriş listesini birleştir</h2><p>Seçtiğin tariflerin porsiyonlarını kontrol et. Ortak malzemeleri tek listede topla, evde bulunanları işaretle. Bu menüler öneridir; alerji, beslenme tercihi ve bütçene göre tarifleri değiştir.</p><p><a href="defterim.html">Menü tariflerini defterimde topla →</a></p>')
article('tarif-defteri-rehberi.html','Kendi Tarif Defterini PDF Olarak Hazırla','Sevdiğin tarifleri kalp düğmesiyle biriktir, defterine isim ver ve tek PDF dosyasında indir.','<h2>1. Tarifleri seç</h2><p>Tarif kartındaki kalbe veya tarif sayfasındaki “Defterime Ekle” düğmesine dokun. Tekrar dokunarak tarifi çıkarabilirsin.</p><h2>2. Defterini aç</h2><p><a href="defterim.html">Benim Defterim</a> sayfasında seçtiğin tarifleri gör. Defter başlığını değiştir ve indirmeden önce önizle.</p><h2>3. PDF dosyasını indir</h2><p>PDF indirme düğmesi, kapak ve seçtiğin tarifleri bir dosyada birleştirir. Tek tarif indirmek için o tarifin sayfasındaki PDF İndir düğmesini kullan.</p><h2>Defterim başka telefonda görünür mü?</h2><p>Favoriler bu tarayıcının yerel depolamasında saklanır. Hesap veya cihazlar arasında eşitleme yoktur. Tarayıcı verilerini temizlemek favorileri kaldırabilir; saklamak istediğin defteri PDF olarak indir.</p>')
article('rehberler.html','Mutfak Rehberi','Ölçüleri anlamak, sofrayı planlamak ve tariflerini saklamak için kısa, kullanışlı rehberler.','<div class="guide-links"><a href="olcu-rehberi.html"><h2>Mutfak ölçüleri</h2><p>Su bardağı kaç ml? Gram ile ml neden farklı?</p></a><a href="sofra-planlama.html"><h2>Bugün ne pişirsem?</h2><p>Bakliyat, tavuk ve çay saati için üç menü.</p></a><a href="tarif-defteri-rehberi.html"><h2>PDF tarif defteri</h2><p>Favorileri biriktir, isim ver, dosyanı indir.</p></a></div>')
article('hakkimizda.html','Hakkımızda ve İçerik Yaklaşımımız','Anne Mutfağından Sana, ev usulü tarifleri açık ölçülerle sunan ve kişisel tarif defteri oluşturmana yardımcı olan bir tarif koleksiyonudur.','<h2>Tariflerde ne bulacaksın?</h2><p>Malzemeler, adım adım yapılış, yaklaşık süre, porsiyon bilgisi ve püf noktası. Tarifler Türk mutfağındaki ev yemeklerinden ilham alır. Her tarifin mutfakta bağımsız olarak test edildiği iddia edilmez.</p><h2>Görseller nasıl hazırlanıyor?</h2><p>Tarif görselleri yapay zekâ ile hazırlanmış sunum örnekleridir; tarifin birebir pişirilmiş fotoğrafı değildir. İçerik hazırlama sürecinde de yapay zekâ desteği kullanılabilir.</p><h2>Süreler ve ölçüler</h2><p>Pişirme süreleri yaklaşık değerlerdir. Ekipman, malzeme ve hazırlık hızı sonucu etkiler. Sitedeki su bardağı 200 ml, çay bardağı 100 ml kabul edilir. <a href="olcu-rehberi.html">Ölçü rehberini incele.</a></p><h2>Düzeltme ve öneriler</h2><p>Bir ölçü veya anlatım hatası fark edersen tarif adını ve ilgili adımı belirterek <a href="https://github.com/alperen15100/Anne-Mutfagindan-Sana/issues">projenin GitHub bildirim sayfasından</a> iletebilirsin. Bildirim oluşturmak GitHub hesabı gerektirebilir.</p>')
article('gizlilik.html','Gizlilik ve Favori Verileri','Favori tariflerin ve defter başlığın kullandığın tarayıcıda saklanır. Bu özellik için hesap açman gerekmez.','<h2>Tarayıcıda saklanan bilgiler</h2><p>Favoriler ams_favorites_v1, defter başlığı ams_book_title_v1 anahtarlarıyla yerel depolamada tutulur. Defter özelliği bu bilgileri sunucuya göndermez.</p><h2>Verileri kaldırma</h2><p>Tarifleri kalbe tekrar dokunarak defterinden çıkarabilirsin. Tarayıcının site verilerini temizlemek favori listesini ve kayıtlı başlığı kaldırır.</p><h2>Barındırma ve dış kaynaklar</h2><p>Site GitHub Pages üzerinde barındırılır. Barındırma sağlayıcısı ve harici yazı tipi sağlayıcıları, istekleri kendi uygulamalarına göre işleyebilir. Ayrıntılar için <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub gizlilik açıklamasına</a> ve <a href="https://policies.google.com/privacy">Google gizlilik açıklamasına</a> bakabilirsin.</p><h2>PDF ve bağlantılar</h2><p>PDF dosyaları tarayıcında hazırlanır. Dış bağlantılar ilgili hizmetin kendi koşullarına tabidir. Reklam veya analitik eklendiğinde kullanılan hizmetler bu sayfada ayrıca açıklanmalıdır.</p>')
import runpy
runpy.run_path(str(ROOT/'scripts/build_kitchen.py'),init_globals=globals())
ns='http://www.sitemaps.org/schemas/sitemap/0.9'; ins='http://www.google.com/schemas/sitemap-image/1.1'
ET.register_namespace('',ns);ET.register_namespace('image',ins)
root=ET.Element('{'+ns+'}urlset')
for path in pages:
    el=ET.SubElement(root,'{'+ns+'}url');ET.SubElement(el,'{'+ns+'}loc').text=BASE+path
    if path.startswith('tarif-') and path!='tarif-defteri-rehberi.html':
        im=ET.SubElement(el,'{'+ins+'}image');ET.SubElement(im,'{'+ins+'}loc').text=BASE+'assets/recipes/'+path[6:-5]+'.jpg'
ET.ElementTree(root).write(ROOT/'sitemap.xml',encoding='utf-8',xml_declaration=True)
(ROOT/'llms.txt').write_text('# '+NAME+'\n\n> Türkçe ev usulü yemek tarifleri. Görseller yapay zekâ ile üretilmiş sunum örnekleridir.\n\n## Tarifler\n'+''.join(f'- [{r["title"]}]({BASE+rurl(r)}): {r["desc"]}\n' for r in recipes)+'\n## Site bilgileri\n- [Mutfak Rehberi]('+BASE+'rehberler.html)\n- [İçerik yaklaşımı]('+BASE+'hakkimizda.html)\n- [Site haritası]('+BASE+'sitemap.xml)\n')
print(f'Generated {len(pages)} indexable pages and image sitemap.')
