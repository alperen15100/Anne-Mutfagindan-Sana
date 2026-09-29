# Anne Mutfağından Sana — İlk Çalışan Sürüm

Bu sürüm tamamen statik HTML/CSS/JS'dir ve API gerektirmez.

## Önemli: Benim Defterim mantığı
- Bir tarif kartındaki kalbe basıldığında tarif `localStorage` ile favorilere kaydedilir.
- Favoriye eklenen tarif otomatik olarak **Defterim** sayfasına gelir.
- Defterim sayfasından kaldırılırsa favoriden de çıkar.
- Aynı tarayıcı/telefonda sayfa yenilense bile favoriler kalır.
- Tarayıcı verileri temizlenirse yerel favoriler silinir.
- İleride giriş sistemi eklenirse aynı yapı Supabase hesabına senkronlanabilir.

## Sayfalar
- `index.html` — Ana sayfa
- `kategori.html` — Tarif/kategori listesi
- `tarif.html?id=mercimek-corbasi` — Dinamik tarif detayı
- `defterim.html` — Favorilerden otomatik oluşan tarif defteri

## Çalıştırma
Dosyaları Netlify / GitHub Pages gibi statik hostinge yükleyebilirsin.
Yerelde de `index.html` açılır; ancak en sağlıklısı basit bir HTTP sunucusudur.

## Görseller
Bu GitHub sürümünde sayfanın hemen çalışması için yemek fotoğrafları uzaktaki görsel URL'lerinden yüklenir. Tasarım ve favori/Defterim mantığı tamamen repodadır. Üretilen özel suluboya görseller daha sonra `assets/` klasörüne taşınabilir.
