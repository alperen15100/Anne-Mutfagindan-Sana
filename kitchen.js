/* Pantry, portions, shopping and cooking tools. Data stays in this browser. */
const SHOP_KEY='ams_shopping_v1', PORTION_KEY='ams_portions_v1';
const pantryItems=['Patates','Yumurta','Yoğurt','Süt','Un','Pirinç','Bulgur','Mercimek','Nohut','Kuru fasulye','Tavuk','Kıyma','Domates','Biber','Soğan','Sarımsak','Kabak','Patlıcan','Havuç','Salatalık','Peynir','Yufka','İrmik','Bisküvi','Şeker','Tereyağı','Zeytinyağı','Salça'];
function normalizeFood(s){return slugify(s).replaceAll('-',' ')}
function readKitchen(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function writeKitchen(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{toast('Tarayıcı veriyi kaydedemedi.');return false}}
function yieldInfo(r){const nums=(r.servings||'4 kişilik').match(/\d+/g)?.map(Number)||[4];const range=/[–-]/.test(r.servings);return {base:range?(nums[0]+nums[1])/2:nums[0],unit:r.servings.includes('kişilik')?'kişi':r.servings.includes('dilim')?'dilim':r.servings.includes('kase')?'kase':'adet',range};}
function recipeTarget(r){const all=readKitchen(PORTION_KEY,{}),n=Number(all[r.id]);return Number.isFinite(n)&&n>=1&&n<=40?n:yieldInfo(r).base}
function formatAmount(n){return (Math.round(n*100)/100).toLocaleString('tr-TR',{maximumFractionDigits:2,useGrouping:false})}
function scaleIngredient(line,factor){
  if(factor===1)return line;
  // Parenthetical package sizes describe one package; preserve them.
  const protectedParts=[];line=line.replace(/\([^)]*\)/g,x=>'§'+(protectedParts.push(x)-1)+'§');
  const quantity=/(yarımşar|yarım|çeyrek|\d+(?:[.,]\d+)?)(?:\s*[–-]\s*(yarım|\d+(?:[.,]\d+)?))?(?=\s*(?:su bardağı|çay bardağı|yemek kaşığı|tatlı kaşığı|çay kaşığı|adet|demet|paket|dal|diş|çimdik|kase|g\b|kg\b|ml\b|litre|yumurta))/gi;
  const numeric=x=>/^yarım/i.test(x)?0.5:/^çeyrek/i.test(x)?0.25:Number(x.replace(',','.'));
  line=line.replace(quantity,(whole,a,b)=>formatAmount(numeric(a)*factor)+(b?'–'+formatAmount(numeric(b)*factor):'')+(/şar$/i.test(a)?' (her birinden)':''));
  return line.replace(/§(\d+)§/g,(_,i)=>protectedParts[i]);
}
function scaledRecipe(r,target=recipeTarget(r)){
  const info=yieldInfo(r),factor=target/info.base;
  if(factor===1)return {...r};
  return {...r,ingredients:r.ingredients.map(x=>scaleIngredient(x,factor)),servings:'Yaklaşık '+formatAmount(target)+' '+info.unit,tip:r.tip+' Ölçekleme: '+formatAmount(factor)+' kat. Pişirme süresini aynı oranla artırma; kıvamı kontrol et.'};
}
function recipeFoods(r){
  const text=' '+normalizeFood(r.ingredients.join(' ')).replaceAll('domates salcasi','salca').replaceAll('biber salcasi','salca')+' ';
  return pantryItems.filter(item=>{
    let keys=[normalizeFood(item)];
    if(item==='Mercimek')keys=['mercimek'];if(item==='Kuru fasulye')keys=['fasulye'];if(item==='Tavuk')keys=['tavuk'];if(item==='Peynir')keys=['peynir','peyniri','kasar'];if(item==='Salça')keys=['salca','salcasi'];
    return keys.some(k=>new RegExp('(^| )'+k+'( |$)').test(text));
  });
}
function renderPantry(){
  const form=$('#pantryForm');if(!form)return;
  const inputs=$$('input[name="pantry"]',form),maxTime=$('#pantryTime'),strict=$('#pantryStrict');
  const update=()=>{
    const chosen=inputs.filter(i=>i.checked).map(i=>i.value),limit=Number(maxTime.value)||Infinity;
    if(!chosen.length){$('#pantryStatus').textContent='Bir veya daha fazla malzeme seç. Sonuçlarda eksik malzemeleri de göreceksin.';$('#pantryResults').innerHTML='';return;}
    const scored=window.RECIPES.map(r=>{const foods=recipeFoods(r),missing=foods.filter(x=>!chosen.includes(x)),hits=foods.length-missing.length;return {r,foods,missing,hits,ratio:hits/(foods.length||1)}}).filter(x=>x.hits>0&&(sumRecipeMinutes(x.r)<=limit)&&(!strict.checked||x.missing.length===0)).sort((a,b)=>b.ratio-a.ratio||b.hits-a.hits);
    $('#pantryStatus').textContent=scored.length+' tarif önerisi · Su, tuz ve listede bulunmayan malzemeleri tarif sayfasında kontrol et.';
    $('#pantryResults').innerHTML=scored.length?scored.map(x=>'<div class="pantry-result">'+compactCard(x.r)+'<div class="match-note"><strong>'+x.hits+'/'+x.foods.length+' seçilebilir malzeme var</strong><p>'+(x.missing.length?'Kontrol et: '+escapeHtml(x.missing.join(', ')):'Seçilebilir ana malzemeler tamam.')+'</p></div></div>').join(''):'<div class="empty-state"><h2>Bu seçime uygun tarif yok</h2><p>Malzeme ekle veya süre sınırını kaldır.</p></div>';
    hydrateArt();updateFavUI();
  };
  form.addEventListener('change',update);form.addEventListener('submit',e=>{e.preventDefault();update()});$('#pantryReset').onclick=()=>{inputs.forEach(i=>i.checked=false);maxTime.value='';strict.checked=false;update()};update();
}
function sumRecipeMinutes(r){let total=0;for(const m of r.time.matchAll(/(\d+)\s*(dk|saat)/g))total+=Number(m[1])*(m[2]==='saat'?60:1);return total}
function updatePortions(r){
  const target=recipeTarget(r),scaled=scaledRecipe(r,target),info=yieldInfo(r);
  $('#ingredients').innerHTML=scaled.ingredients.map(x=>'<label class="ingredient"><input type="checkbox"><span>'+escapeHtml(x)+'</span></label>').join('');
  $('#detailServings').textContent=target===info.base?r.servings:'Yaklaşık '+formatAmount(target)+' '+info.unit;
  $('#portionStatus').textContent=target===info.base?'Tarifin özgün ölçüleri.':'Malzemeler '+formatAmount(target/info.base)+' katına ayarlandı. Pişirme süresi değişmez bir hesapla ölçeklenmez.';
  $('#portionInput').value=target;
}
function initPortions(){
  if(document.body.dataset.page!=='tarif')return;
  const r=getRecipe(),info=yieldInfo(r),panel=document.createElement('div');panel.className='portion-control';
  panel.innerHTML='<div><strong>Miktarı ayarla</strong><span>Özgün tarif: '+escapeHtml(r.servings)+'</span></div><label for="portionInput">'+(info.unit==='kişi'?'Kişi sayısı':'Adet / dilim')+'</label><div class="portion-input"><button type="button" id="portionMinus" aria-label="Miktarı azalt">−</button><input id="portionInput" type="number" min="1" max="40" step="1" value="'+info.base+'"><button type="button" id="portionPlus" aria-label="Miktarı artır">+</button></div><button class="btn" id="portionReset" type="button">Özgün ölçü</button><p id="portionStatus" role="status"></p>'+(info.range?'<p class="content-note">Tarif aralık verdiği için hesap '+info.base+' '+info.unit+' üzerinden yaklaşık yapılır.</p>':'');
  $('#ingredients').before(panel);
  const set=n=>{if(!Number.isFinite(n)||n<1||n>40){toast('1 ile 40 arasında miktar seç.');return}const all=readKitchen(PORTION_KEY,{});all[r.id]=n;if(writeKitchen(PORTION_KEY,all))updatePortions(r)};
  $('#portionInput').oninput=e=>{const n=Number(e.target.value);if(e.target.value&&Number.isFinite(n)&&n>=1&&n<=40)set(n)};$('#portionInput').onchange=e=>{const n=Number(e.target.value);if(!e.target.value||n<1||n>40){updatePortions(r);toast('1 ile 40 arasında miktar seç.');return}set(n)};$('#portionMinus').onclick=()=>set(Math.max(1,recipeTarget(r)-1));$('#portionPlus').onclick=()=>set(Math.min(40,recipeTarget(r)+1));$('#portionReset').onclick=()=>set(info.base);
  const actions=$('.detail-copy .actions');actions.insertAdjacentHTML('beforeend','<button class="btn" id="addShopping" type="button">Alışverişe Ekle</button><button class="btn" id="startCooking" type="button">Pişirmeye Başla</button>');
  $('#addShopping').onclick=()=>addShopping([r.id]);$('#startCooking').onclick=()=>startCooking(r);updatePortions(r);
}
function getShopping(){const list=readKitchen(SHOP_KEY,[]);return Array.isArray(list)?list.filter(x=>recipeById(x.id)&&Number.isFinite(x.target)&&x.target>0&&x.target<=40):[]}
function addShopping(ids){if(!ids.length){toast('Önce bir tarif seç.');return}const list=getShopping();for(const id of ids){const r=recipeById(id);if(!r)continue;const old=list.find(x=>x.id===id);if(old){old.target=recipeTarget(r)}else list.push({id,target:recipeTarget(r)})}if(writeKitchen(SHOP_KEY,list))toast('Alışveriş listesine eklendi.');if($('#shoppingList'))renderShopping()}
function shoppingParts(r,target){
  const lines=scaledRecipe(r,target).ingredients.flatMap(line=>line.split(/\s+\+\s+/));
  return lines.map(line=>{
    const clean=line.replace(/^(Sos|Üzeri|Şerbet):\s*/i,'').replace(/^Yarım\s+/i,'0,5 ').replace(/^Çeyrek\s+/i,'0,25 ');
    const match=clean.match(/^(\d+(?:[.,]\d+)?)\s*(su bardağı|çay bardağı|yemek kaşığı|tatlı kaşığı|çay kaşığı|adet|demet|paket|dal|diş|çimdik|kase|g|kg|ml|litre)\s+(.+)$/);
    if(!match)return {text:line,key:normalizeFood(line),amount:null,unit:'',name:line};
    const [,amount,unit,name]=match;
    // Only identical ingredient names and units can be added safely.
    return {text:line,key:normalizeFood(name)+'|'+unit,amount:Number(amount.replace(',','.')),unit,name};
  });
}
function shoppingRows(){
  const rows=new Map();for(const item of getShopping()){const r=recipeById(item.id);for(const part of shoppingParts(r,item.target)){if(part.amount===null)part.key+='|'+r.id+'|'+rows.size;const old=rows.get(part.key);if(old&&part.amount!==null&&old.amount!==null){old.amount+=part.amount;old.sources.add(r.title)}else if(old){old.sources.add(r.title)}else rows.set(part.key,{...part,sources:new Set([r.title])});}}
  return [...rows.values()].map(p=>({...p,text:p.amount===null?p.text:formatAmount(p.amount)+' '+p.unit+' '+p.name}));
}
function renderShopping(){
  if(!$('#shoppingList'))return;
  const recipes=getShopping(),rows=shoppingRows();$('#shoppingRecipes').innerHTML=recipes.map(x=>{const r=recipeById(x.id);return '<div class="shopping-recipe"><a href="'+recipeURL(x.id)+'">'+escapeHtml(r.title)+'</a><span>'+formatAmount(x.target)+' '+yieldInfo(r).unit+'</span><button type="button" class="btn" data-shop-remove="'+x.id+'" aria-label="'+escapeHtml(r.title)+' listesinden çıkar">Çıkar</button></div>'}).join('');
  $('#shoppingList').innerHTML=rows.length?rows.map((x,i)=>'<label class="shopping-item"><input type="checkbox" data-shop-index="'+i+'"><span><strong>'+escapeHtml(x.text)+'</strong><small>'+escapeHtml([...x.sources].join(' · '))+'</small></span></label>').join(''):'<div class="empty-state"><h2>Listen henüz boş</h2><p>Tarif sayfasından, defterinden veya bir menüden tarif ekle.</p><a class="btn" href="menuler.html">Menülere Bak</a></div>';
  $('#shoppingStatus').textContent=recipes.length+' tarif · '+rows.length+' malzeme satırı';
  $$('[data-shop-remove]').forEach(b=>b.onclick=()=>{writeKitchen(SHOP_KEY,getShopping().filter(x=>x.id!==b.dataset.shopRemove));renderShopping()});
  $('#shoppingClear').onclick=()=>{writeKitchen(SHOP_KEY,[]);renderShopping()};
  $('#shoppingCopy').onclick=async()=>{const text=shoppingText();if(!rows.length){toast('Önce bir tarif ekle.');return}try{await navigator.clipboard.writeText(text);toast('Liste kopyalandı.')}catch{downloadShoppingText()}};
  $('#shoppingDownload').onclick=downloadShoppingText;
}
function shoppingText(){return 'Alışveriş Listem\n\n'+shoppingRows().filter((x,i)=>!document.querySelector('[data-shop-index="'+i+'"]')?.checked).map(x=>'□ '+x.text).join('\n')+'\n\nAynı malzeme ve birimler toplanır. Aralıklar, soslar ve isteğe bağlı malzemeler ayrıca kontrol edilmelidir.'}
function downloadShoppingText(){if(!shoppingRows().length){toast('Önce bir tarif ekle.');return}const url=URL.createObjectURL(new Blob([shoppingText()],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='alisveris-listem.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
let cookingDialog=null,wakeLock=null;
function startCooking(r){
  cookingDialog?.remove();const previous=document.activeElement;let index=0;const checked=new Set();
  const modal=document.createElement('div');modal.className='cooking-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',r.title+' pişirme modu');cookingDialog=modal;
  modal.innerHTML='<section class="cooking-sheet"><button class="btn cooking-close" type="button">Kapat ✕</button><p class="kicker">Pişirme modu</p><h2>'+escapeHtml(r.title)+'</h2><p id="cookingProgress" role="status"></p><div id="cookingStep" class="cooking-step"></div><label class="cooking-done"><input id="cookingDone" type="checkbox">Bu adımı tamamladım</label><div class="actions"><button class="btn" id="cookingPrev" type="button">← Önceki</button><button class="btn primary" id="cookingNext" type="button">Sonraki →</button></div><details><summary>Malzemeleri göster</summary><ul>'+scaledRecipe(r).ingredients.map(x=>'<li>'+escapeHtml(x)+'</li>').join('')+'</ul></details><p class="content-note">Ekranı açık tutma destekleniyorsa etkinleştirilir. Pişirme modu bitince normal görünüme dönersin.</p></section>';
  document.body.appendChild(modal);document.body.classList.add('cooking-open');
  const close=()=>{modal.remove();document.body.classList.remove('cooking-open');wakeLock?.release().catch(()=>{});wakeLock=null;cookingDialog=null;previous?.focus()};
  const update=()=>{$('#cookingProgress').textContent='Adım '+(index+1)+' / '+r.steps.length+' · '+checked.size+' tamamlandı';$('#cookingStep').textContent=r.steps[index];$('#cookingDone').checked=checked.has(index);$('#cookingPrev').disabled=index===0;$('#cookingNext').textContent=index===r.steps.length-1?'Bitir ✓':'Sonraki →'};
  $('.cooking-close',modal).onclick=close;$('#cookingPrev').onclick=()=>{index=Math.max(0,index-1);update()};$('#cookingNext').onclick=()=>{if(index===r.steps.length-1){close();toast('Afiyet olsun!');return}index++;update()};$('#cookingDone').onchange=e=>{if(e.target.checked)checked.add(index);else checked.delete(index);update()};
  modal.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const els=$$('button:not(:disabled),input,summary',modal),first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});update();$('.cooking-close',modal).focus();if(navigator.wakeLock)navigator.wakeLock.request('screen').then(x=>{if(cookingDialog===modal)wakeLock=x;else x.release()}).catch(()=>{});
}
document.addEventListener('DOMContentLoaded',()=>{
  renderPantry();initPortions();renderShopping();
  document.addEventListener('click',e=>{const menu=e.target.closest('[data-menu-shopping]');if(menu)addShopping(menu.dataset.menuShopping.split(','));const fav=e.target.closest('[data-menu-favorites]');if(fav){const ids=fav.dataset.menuFavorites.split(',').filter(recipeById);setFavs([...new Set([...getFavs(),...ids])]);toast('Menü tarifleri defterine eklendi.')}const book=e.target.closest('[data-shopping-favorites]');if(book)addShopping(getFavs());});
});
