"""Visible practical guides and consistent site identity. Included by build_seo."""
guides=[
 ('porsiyon-hesaplama.html','Tarif Porsiyonu Nasıl Artırılır?','4 kişilik bir tarifi 6 veya 8 kişiye uyarlarken malzemeleri hesapla; pişirme süresini ve kabın boyutunu ayrı değerlendir.',
 '<h2>Önce tarifin verdiği miktarı oku</h2><p>Kişi, adet, dilim ve kase aynı ölçü değildir. Krepte adet, ana yemekte kişi bilgisini esas al. Sitedeki miktar seçici tarifin kendi birimini kullanır; aralık verilen tariflerde hesap yaklaşık değerdir.</p><h2>Malzeme hesabı</h2><p>Çarpan = istediğin miktar ÷ tarifteki miktar. 4 kişilik tarifi 6 kişiye hazırlamak için çarpan 1,5; 8 kişiye hazırlamak için 2 olur.</p><table><thead><tr><th>4 kişilik tarifte</th><th>6 kişilik</th><th>8 kişilik</th></tr></thead><tbody><tr><td>2 su bardağı</td><td>3 su bardağı</td><td>4 su bardağı</td></tr><tr><td>1 yemek kaşığı</td><td>1,5 yemek kaşığı</td><td>2 yemek kaşığı</td></tr><tr><td>200 gram</td><td>300 gram</td><td>400 gram</td></tr></tbody></table><p>Bu tablo matematiksel dönüşüm örneğidir. Tuz ve baharat gibi belirsiz ölçüleri tadına göre, tarifin açıklamasını dikkate alarak ayarla.</p><h2>Süre neden iki katına çıkmaz?</h2><p>Miktarı artırmak daha büyük tencere veya tepsi gerektirebilir. Kalınlık, kap boyutu ve ekipman değiştiği için süreyi otomatik katlamak yerine tarifteki pişme belirtilerini izle.</p><h2>Sitede nasıl uygularım?</h2><ol><li><a href="tarif-tavuk-sote.html">Tavuk sote tarifini</a> aç ve miktarı ayarla.</li><li>Değişen malzeme listesini kontrol et.</li><li>Alışverişe ekle veya güncellenmiş miktarlarla PDF indir.</li></ol><p><a href="olcu-rehberi.html">Bardak ile gram arasındaki farkı oku</a> · <a href="alisveris-listem.html">Alışveriş listemi aç</a></p>'),
 ('yemek-hazirlik-plani.html','Yemek Hazırlığını Hangi Sırayla Yapmalı?','Islatma, mayalanma, soğutma ve pişirme adımlarını servis saatinden geriye doğru planla.',
 '<h2>En uzun bekleme önce gelir</h2><p>Yalnızca ocak başındaki süreyi sayma. <a href="tarif-kuru-fasulye.html">Kuru fasulyenin</a> ıslatılması, <a href="tarif-pogaca.html">poğaçanın</a> mayalanması ve <a href="tarif-mozaik-pasta.html">mozaik pastanın</a> soğutulması servis planını etkiler. Her tarifin toplam süre bilgisini ve adımlarını önceden oku.</p><h2>Çay sofrası örneği</h2><ol><li>Mozaik pastayı tarifteki en az dört saatlik soğutmaya zaman kalacak şekilde hazırla.</li><li><a href="tarif-kisir.html">Kısırın</a> bulgurunu dinlendirme aşamasını planla.</li><li><a href="tarif-patatesli-borek.html">Patatesli böreği</a> hazırlayıp fırın sırasına koy.</li></ol><p>Tarif sürelerini toplamak sofranın kesin hazır olma saatini vermez. Aynı ocak veya fırını paylaşan yemekler için ayrıca zaman ayır.</p><h2>Vaktim yalnızca 30 dakika ise?</h2><p><a href="koleksiyon-30-dakikada-yemekler.html">30 dakika ve altındaki tariflerden</a> seç. Bu koleksiyon tek tek tariflerin belirtilen toplam süresine göre hazırlanır; listedeki birkaç yemeği birlikte yapmanın 30 dakika süreceği anlamına gelmez.</p><h2>Başlamadan önce üç kontrol</h2><ul><li>Tarifin tam malzeme listesi ve yeterli miktar.</li><li>Tencere, tepsi ve ocak/fırının kullanılabilirliği.</li><li>Bekleme dahil toplam süre ve servis saati.</li></ul><p><a href="menuler.html">Yedi hazır menüyü incele</a> · <a href="mutfakta-ne-var.html">Evdeki malzemelerle tarif seç</a></p>')]
for path,title,desc,body in guides:
 article(path,title,desc,body)
hub=ROOT/'rehberler.html'
hub.write_text(hub.read_text().replace('<div class="guide-links">','<div class="guide-links">'+''.join('<a href="'+path+'"><h2>'+esc(title)+'</h2><p>'+esc(desc)+'</p></a>' for path,title,desc,_ in guides)))
identity={'@type':'Organization','@id':BASE+'#organization','name':NAME,'url':BASE+'hakkimizda.html'}
for path in pages:
 p=ROOT/path;doc=p.read_text()
 def enrich(match):
  data=json.loads(match[1]);graph=data.get('@graph',[{k:v for k,v in data.items() if k!='@context'}])
  for item in graph:
   if item.get('@type')=='Recipe':
    item['author']={'@id':identity['@id']}
    item['mainEntityOfPage']=BASE+path
   if item.get('@type')=='WebSite':item['publisher']={'@id':identity['@id']}
  graph.append(identity)
  if not any(x.get('@type')=='BreadcrumbList' for x in graph):
   title=re.search(r'<title>(.*?)</title>',doc,re.S)[1].split(' | ')[0]
   graph.append(crumbs([('Ana Sayfa','index.html'),(html.unescape(title),path)]))
  return structured({'@context':'https://schema.org','@graph':graph})
 # Enrich the primary SEO block; leave secondary ItemList blocks intact.
 doc=re.sub(r'<script type="application/ld\+json">(.*?)</script>',enrich,doc,count=1,flags=re.S)
 if path in {rurl(r) for r in recipes}:
  doc=doc.replace('<p class="content-note">Görsel','<p class="content-note">İçerik: <a href="hakkimizda.html">'+NAME+'</a> · <a href="porsiyon-hesaplama.html">Miktar hesaplama rehberi</a></p><p class="content-note">Görsel')
 p.write_text(doc)
# Absolute links work even when the missing URL is nested several directories deep.
article('404.html','Bu Sayfa Bulunamadı','Aradığın tarif taşınmış olabilir. Tarif arşivinden veya malzeme seçicisinden devam edebilirsin.','<div class="actions"><a class="btn primary" href="kategori.html">Tarif arşivi</a><a class="btn" href="mutfakta-ne-var.html">Malzemelerime göre seç</a></div>')
error=ROOT/'404.html';doc=error.read_text().replace('index,follow,max-image-preview:large','noindex,follow')
doc=re.sub(r'(href|src)="(?!https?:|#|data:)([^" ]+)"',lambda m:m[1]+'="'+BASE+m[2]+'"',doc)
error.write_text(doc);pages.remove('404.html')
