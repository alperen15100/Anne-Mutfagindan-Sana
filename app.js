
const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>[...r.querySelectorAll(s)];
const favoritesKey = "ams_favorites_v1";
const titleKey = "ams_book_title_v1";

function getFavs(){
  try{return JSON.parse(localStorage.getItem(favoritesKey) || "[]")}catch{return []}
}
function setFavs(arr){localStorage.setItem(favoritesKey, JSON.stringify(arr)); updateFavUI();}
function isFav(id){return getFavs().includes(id)}
function toggleFav(id){
  let favs=getFavs();
  if(favs.includes(id)){favs=favs.filter(x=>x!==id); toast("Tarif defterinden çıkarıldı.");}
  else{favs.unshift(id); toast("Tarif Benim Defterim'e eklendi. ❤️");}
  setFavs(favs);
  if(document.body.dataset.page==="defterim") renderDefterim();
}
function toast(msg){
  let t=$("#toast"); if(!t){t=document.createElement("div");t.id="toast";t.className="toast";document.body.appendChild(t);}
  t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)
}
function updateFavUI(){
  $$(".heart[data-id]").forEach(b=>{
    const active=isFav(b.dataset.id); b.classList.toggle("active",active); b.textContent=active?"♥":"♡";
  });
  const count=getFavs().length;
  $$("[data-fav-count]").forEach(x=>x.textContent=count||"");
}
const IMAGE_MAP = {
  "mercimek-corbasi":"https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=82",
  "ezogelin":"https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=82",
  "menemen":"https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=82",
  "yaprak-sarma":"https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=82",
  "pogaca":"https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=82",
  "revani":"https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=82",
  "sutlac":"https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=82",
  "krep":"https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=82",
  "firin-makarna":"https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=82",
  "imam-bayildi":"https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=82",
  "patates-salatasi":"https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=82",
  "pirinc-pilavi":"https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=82",
  "havuc-tarator":"https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=82",
  "elmali-kurabiye":"https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=82",
  "su-boregi":"https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=82"
};
function img(id,type="thumb"){return IMAGE_MAP[id] || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=82"}
function card(r){
  return `<article class="recipe-card paper">
    <button class="heart ${isFav(r.id)?"active":""}" data-id="${r.id}" aria-label="Favoriye ekle">${isFav(r.id)?"♥":"♡"}</button>
    <a href="tarif.html?id=${r.id}"><img class="thumb" src="${img(r.id)}" alt="${r.title}"></a>
    <div class="recipe-body">
      <a class="recipe-title" href="tarif.html?id=${r.id}">${r.title}</a>
      <div class="meta"><span class="stars">★★★★★</span><span>${r.rating}</span></div>
      <div class="meta"><span>◷ ${r.time}</span><span>${r.category}</span></div>
    </div></article>`;
}
function bindHearts(){
  document.addEventListener("click",e=>{
    const b=e.target.closest(".heart[data-id]");
    if(b){e.preventDefault();toggleFav(b.dataset.id)}
  })
}
function navActive(){
  const p=document.body.dataset.page;
  $$("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav===p));
}
function globalSearch(){
  const s=$("#globalSearch");
  if(!s)return;
  s.addEventListener("keydown",e=>{
    if(e.key==="Enter"){location.href=`kategori.html?q=${encodeURIComponent(s.value)}`}
  })
}
function renderHome(){
  const popular=window.RECIPES.slice(0,8);
  $("#popularGrid").innerHTML=popular.slice(0,4).map(card).join("");
  $("#miniRibbon").innerHTML=popular.slice(4,8).map(r=>`<a class="mini paper" href="tarif.html?id=${r.id}"><img src="${img(r.id)}"><div><strong>${r.title}</strong><div class="stars">★★★★★</div></div></a>`).join("");
}
function renderCategory(){
  const params=new URLSearchParams(location.search);
  const q=(params.get("q")||"").trim().toLowerCase();
  const cat=params.get("cat")||"";
  let list=[...window.RECIPES];
  if(cat) list=list.filter(r=>r.category.toLowerCase().includes(cat.toLowerCase()));
  if(q) list=list.filter(r=>(r.title+" "+r.category+" "+r.desc).toLowerCase().includes(q));
  $("#resultCount").textContent=`${list.length} tarif bulundu`;
  $("#categoryGrid").innerHTML=list.map(card).join("") || `<div class="paper empty">Aramana uygun tarif bulunamadı.</div>`;
}
function getRecipe(){
  const id=new URLSearchParams(location.search).get("id") || "mercimek-corbasi";
  return window.RECIPES.find(r=>r.id===id) || window.RECIPES[0];
}
function renderDetail(){
  const r=getRecipe();
  document.title=`${r.title} | Anne Mutfağından Sana`;
  $("#detailImg").src=img(r.id); $("#detailTitle").textContent=r.title; $("#detailDesc").textContent=r.desc;
  $("#detailTime").textContent=r.time; $("#detailRating").textContent=r.rating;
  const hb=$("#detailHeart"); hb.dataset.id=r.id; hb.textContent=isFav(r.id)?"♥ Kaydedildi":"♡ Kaydet"; hb.classList.toggle("primary",isFav(r.id));
  $("#ingredients").innerHTML=r.ingredients.map(x=>`<label><input type="checkbox"> <span>${x}</span></label>`).join("");
  $("#steps").innerHTML=r.steps.map((x,i)=>`<div class="step"><div class="num">${i+1}</div><div>${x}</div></div>`).join("");
  $("#tipText").textContent=r.tip; $("#noteText").textContent=r.note;
  const related=window.RECIPES.filter(x=>x.id!==r.id && x.category===r.category).slice(0,4);
  $("#related").innerHTML=(related.length?related:window.RECIPES.filter(x=>x.id!==r.id).slice(0,4)).map(x=>`<a class="mini-card" href="tarif.html?id=${x.id}"><img src="${img(x.id)}"><strong>${x.title}</strong></a>`).join("");
  $("#posterPreview").src=img(r.id,"poster");
}
function renderDefterim(){
  const favs=getFavs();
  const list=favs.map(id=>window.RECIPES.find(r=>r.id===id)).filter(Boolean);
  const wrap=$("#favItems");
  if(!list.length){
    wrap.innerHTML=`<div class="empty">Henüz favori tarifin yok.<br><br>Tariflerdeki <b>♡</b> simgesine dokunduğunda otomatik olarak buraya gelir.<br><br><a class="btn primary" href="kategori.html">Tariflere Göz At</a></div>`;
  } else {
    wrap.innerHTML=list.map(r=>`<div class="fav-item">
      <a href="tarif.html?id=${r.id}"><img src="${img(r.id)}"></a>
      <div><strong>${r.title}</strong><div class="meta">${r.category} · ${r.time}</div></div>
      <button class="remove" data-remove="${r.id}" aria-label="Kaldır">×</button></div>`).join("");
  }
  $("#favCount").textContent=list.length;
  const t=$("#bookTitle");
  const saved=localStorage.getItem(titleKey)||"Annemden Bana Tarifler";
  t.value=saved; $("#coverTitle").textContent=saved;
  $("#thumbStack").innerHTML=list.slice(0,6).map(r=>`<img src="${img(r.id,"poster")}" alt="${r.title}">`).join("") || `<div class="empty">Tarif ekledikçe sayfalar burada görünecek.</div>`;
}
function defterimEvents(){
  document.addEventListener("click",e=>{
    const r=e.target.closest("[data-remove]");
    if(r){toggleFav(r.dataset.remove)}
  });
  const t=$("#bookTitle");
  if(t)t.addEventListener("input",()=>{localStorage.setItem(titleKey,t.value);$("#coverTitle").textContent=t.value||"Benim Tarif Defterim"});
}
function printPage(){window.print()}
document.addEventListener("DOMContentLoaded",()=>{
  navActive(); bindHearts(); globalSearch(); updateFavUI();
  const p=document.body.dataset.page;
  if(p==="home")renderHome();
  if(p==="kategori")renderCategory();
  if(p==="tarif")renderDetail();
  if(p==="defterim"){renderDefterim();defterimEvents();}
});
