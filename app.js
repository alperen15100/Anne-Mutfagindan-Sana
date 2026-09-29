const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const favoritesKey="ams_favorites_v1";
const titleKey="ams_book_title_v1";

const ART={
  "krep":[0,0],
  "mercimek-corbasi":[1,0],
  "menemen":[2,0],
  "yaprak-sarma":[3,0],
  "pogaca":[4,0],
  "revani":[0,1],
  "sutlac":[1,1],
  "ezogelin":[2,1],
  "firin-makarna":[3,1],
  "imam-bayildi":[4,1]
};

function getFavs(){try{return JSON.parse(localStorage.getItem(favoritesKey)||"[]")}catch{return []}}
function setFavs(v){localStorage.setItem(favoritesKey,JSON.stringify(v));updateFavUI()}
function isFav(id){return getFavs().includes(id)}
function toggleFav(id){
  let favs=getFavs();
  if(favs.includes(id)){favs=favs.filter(x=>x!==id);toast("Tarif defterinden çıkarıldı.")}
  else{favs.unshift(id);toast("Tarif Benim Defterim'e eklendi. ♥")}
  setFavs(favs);
  if(document.body.dataset.page==="defterim")renderDefterim();
}
function toast(msg){
  let t=$("#toast");
  if(!t){t=document.createElement("div");t.id="toast";t.className="toast";document.body.appendChild(t)}
  t.textContent=msg;t.classList.add("show");clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>t.classList.remove("show"),1900);
}
function updateFavUI(){
  $$(".heart[data-id]").forEach(b=>{
    const a=isFav(b.dataset.id);b.classList.toggle("active",a);b.textContent=a?"♥":"♡";
  });
  const hb=$("#detailHeart");
  if(hb&&hb.dataset.id){const a=isFav(hb.dataset.id);hb.textContent=a?"♥ Kaydedildi":"♡ Kaydet";hb.classList.toggle("primary",a)}
  $$("[data-fav-count]").forEach(x=>x.textContent=getFavs().length||"");
}

function setArt(el,id){
  const p=ART[id]||ART.krep;
  el.style.setProperty("--sx",String(p[0]));
  el.style.setProperty("--sy",String(p[1]));
  el.setAttribute("data-art",id);
}
function hydrateArt(root=document){$$("[data-art]",root).forEach(el=>setArt(el,el.dataset.art))}
function art(id,cls=""){return '<div class="recipe-art '+cls+'" data-art="'+id+'" role="img" aria-label="'+escapeHtml(recipeById(id)?.title||"Tarif görseli")+'"></div>'}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function recipeById(id){return (window.RECIPES||[]).find(r=>r.id===id)}

function card(r){
  return '<article class="recipe-card paper">'+
    '<button class="heart '+(isFav(r.id)?"active":"")+'" data-id="'+r.id+'" aria-label="Favoriye ekle">'+(isFav(r.id)?"♥":"♡")+'</button>'+
    '<a href="tarif.html?id='+encodeURIComponent(r.id)+'">'+art(r.id,"thumb")+'</a>'+
    '<div class="recipe-body"><a class="recipe-title" href="tarif.html?id='+encodeURIComponent(r.id)+'">'+escapeHtml(r.title)+'</a>'+
    '<p class="card-desc">'+escapeHtml(r.desc)+'</p>'+
    '<div class="meta"><span class="stars">★★★★★</span><span>'+escapeHtml(r.rating)+'</span></div>'+
    '<div class="meta"><span>◷ '+escapeHtml(r.time)+'</span><span>'+escapeHtml(r.category)+'</span></div></div></article>';
}
function bindHearts(){
  document.addEventListener("click",e=>{
    const b=e.target.closest(".heart[data-id]");
    if(b){e.preventDefault();toggleFav(b.dataset.id)}
  });
}
function navActive(){
  const p=document.body.dataset.page;
  $$("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav===p));
}
function globalSearch(){
  const s=$("#globalSearch");if(!s)return;
  s.addEventListener("keydown",e=>{if(e.key==="Enter"&&s.value.trim())location.href="kategori.html?q="+encodeURIComponent(s.value.trim())});
}
function bindMobileMenu(){
  const b=$(".mobile-menu"),n=$(".nav-links");if(!b||!n)return;
  b.addEventListener("click",()=>n.classList.toggle("open"));
  document.addEventListener("click",e=>{if(!e.target.closest(".nav")&&n.classList.contains("open"))n.classList.remove("open")});
}

function renderHome(){
  const popular=window.RECIPES.slice(0,8);
  $("#popularGrid").innerHTML=popular.slice(0,4).map(card).join("");
  $("#miniRibbon").innerHTML=popular.slice(4,8).map(r=>
    '<a class="mini paper" href="tarif.html?id='+r.id+'">'+art(r.id,"mini-art")+
    '<div><strong>'+escapeHtml(r.title)+'</strong><div class="stars">★★★★★</div><small>'+escapeHtml(r.time)+'</small></div></a>'
  ).join("");
  hydrateArt();
}

function renderCategory(){
  const params=new URLSearchParams(location.search);
  const q=(params.get("q")||"").trim().toLocaleLowerCase("tr-TR");
  const cat=params.get("cat")||"";
  const base=window.RECIPES.filter(r=>{
    if(cat&&!r.category.toLocaleLowerCase("tr-TR").includes(cat.toLocaleLowerCase("tr-TR")))return false;
    if(q&&!(r.title+" "+r.category+" "+r.desc).toLocaleLowerCase("tr-TR").includes(q))return false;
    return true;
  });
  const draw=()=>{
    let list=[...base];
    const cats=$$("[data-filter-cat]:checked").map(x=>x.value);
    const times=$$("[data-filter-time]:checked").map(x=>x.value);
    if(cats.length)list=list.filter(r=>cats.includes(r.category));
    if(times.length)list=list.filter(r=>{
      const n=parseInt(r.time)||0;
      return times.some(t=>(t==="30"&&n<=30)||(t==="60"&&n>30&&n<=60)||(t==="61"&&n>60));
    });
    $("#resultCount").textContent=(q?'“'+params.get("q")+'” · ':"")+list.length+" tarif";
    $("#categoryGrid").innerHTML=list.length?list.map(card).join(""):'<div class="paper empty">Bu filtrelere uygun tarif bulunamadı.</div>';
    hydrateArt();updateFavUI();
  };
  $$("[data-filter-cat],[data-filter-time]").forEach(x=>x.addEventListener("change",draw));
  draw();
}

function getRecipe(){
  const id=new URLSearchParams(location.search).get("id")||"mercimek-corbasi";
  return recipeById(id)||window.RECIPES[0];
}
function renderDetail(){
  const r=getRecipe();document.title=r.title+" | Anne Mutfağından Sana";
  const d=$("#detailImg");setArt(d,r.id);d.setAttribute("aria-label",r.title);
  $("#detailTitle").textContent=r.title;$("#detailDesc").textContent=r.desc;
  $("#detailTime").textContent=r.time;$("#detailRating").textContent=r.rating;
  const hb=$("#detailHeart");hb.dataset.id=r.id;
  $("#ingredients").innerHTML=r.ingredients.map(x=>'<label><input type="checkbox"> <span>'+escapeHtml(x)+'</span></label>').join("");
  $("#steps").innerHTML=r.steps.map((x,i)=>'<div class="step"><div class="num">'+(i+1)+'</div><div>'+escapeHtml(x)+'</div></div>').join("");
  $("#tipText").textContent=r.tip;$("#noteText").textContent=r.note;
  const related=window.RECIPES.filter(x=>x.id!==r.id&&x.category===r.category).slice(0,4);
  const rel=related.length?related:window.RECIPES.filter(x=>x.id!==r.id).slice(0,4);
  $("#related").innerHTML=rel.map(x=>'<a class="mini-card" href="tarif.html?id='+x.id+'">'+art(x.id,"related-art")+'<strong>'+escapeHtml(x.title)+'</strong></a>').join("");
  const pp=$("#posterPreview");setArt(pp,r.id);pp.setAttribute("aria-label",r.title+" tarif kartı");
  hydrateArt();updateFavUI();
}

function renderDefterim(){
  const list=getFavs().map(recipeById).filter(Boolean),wrap=$("#favItems");
  if(!list.length)wrap.innerHTML='<div class="empty">Henüz favori tarifin yok.<br><br>Tariflerdeki <b>♡</b> simgesine dokunduğunda otomatik olarak buraya gelir.<br><br><a class="btn primary" href="kategori.html">Tariflere Göz At</a></div>';
  else wrap.innerHTML=list.map(r=>
    '<div class="fav-item"><a href="tarif.html?id='+r.id+'">'+art(r.id,"fav-art")+'</a>'+
    '<div><strong>'+escapeHtml(r.title)+'</strong><div class="meta">'+escapeHtml(r.category)+' · '+escapeHtml(r.time)+'</div></div>'+
    '<button class="remove" data-remove="'+r.id+'" aria-label="Kaldır">×</button></div>'
  ).join("");
  $("#favCount").textContent=list.length;
  const t=$("#bookTitle"),saved=localStorage.getItem(titleKey)||"Annemden Bana Tarifler";
  t.value=saved;$("#coverTitle").textContent=saved;
  $("#thumbStack").innerHTML=list.length?list.slice(0,6).map(r=>art(r.id,"book-thumb")).join(""):'<div class="empty">Tarif ekledikçe sayfalar burada görünecek.</div>';
  hydrateArt();updateFavUI();
}
function defterimEvents(){
  document.addEventListener("click",e=>{const r=e.target.closest("[data-remove]");if(r)toggleFav(r.dataset.remove)});
  const t=$("#bookTitle");if(t)t.addEventListener("input",()=>{localStorage.setItem(titleKey,t.value);$("#coverTitle").textContent=t.value||"Benim Tarif Defterim"});
}

function slugify(s){return s.toLocaleLowerCase("tr-TR").replaceAll("ı","i").replaceAll("ğ","g").replaceAll("ü","u").replaceAll("ş","s").replaceAll("ö","o").replaceAll("ç","c").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}
function printPage(){window.print()}

function pdfRecipeHTML(r){
  return '<div class="pdf-flower top">✿ ❧ ✿</div><div class="pdf-brand">Anne Mutfağından Sana ♡</div>'+
  '<h1>'+escapeHtml(r.title)+'</h1>'+art(r.id,"pdf-art")+
  '<div class="pdf-meta"><span>◷ '+escapeHtml(r.time)+'</span><span>'+escapeHtml(r.category)+'</span><span>★ '+escapeHtml(r.rating)+'</span></div>'+
  '<div class="pdf-columns"><section><h2>Malzemeler</h2><ul>'+r.ingredients.map(x=>'<li>'+escapeHtml(x)+'</li>').join("")+'</ul></section>'+
  '<section><h2>Yapılışı</h2><ol>'+r.steps.map(x=>'<li>'+escapeHtml(x)+'</li>').join("")+'</ol></section></div>'+
  '<div class="pdf-tip"><b>Püf noktası:</b> '+escapeHtml(r.tip)+'</div>'+
  '<div class="pdf-note"><b>Anne Notu ♡</b> '+escapeHtml(r.note)+'</div>'+
  '<div class="pdf-flower bottom">❧ Afiyet olsun ❧</div>';
}
function makeSheet(html,extra=""){
  const el=document.createElement("div");el.className="pdf-sheet "+extra;el.innerHTML=html;document.body.appendChild(el);hydrateArt(el);return el;
}
async function sheetCanvas(el){
  if(!window.html2canvas)throw new Error("PDF görüntü motoru yüklenemedi");
  if(document.fonts?.ready)await document.fonts.ready;
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  return await html2canvas(el,{scale:1.55,backgroundColor:"#fffaf1",useCORS:true,logging:false});
}
async function downloadRecipePDF(){
  try{
    const r=getRecipe();toast("PDF hazırlanıyor…");
    const sheet=makeSheet(pdfRecipeHTML(r));
    const canvas=await sheetCanvas(sheet);sheet.remove();
    const {jsPDF}=window.jspdf||{};if(!jsPDF)throw new Error("PDF kütüphanesi yüklenemedi");
    const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
    pdf.addImage(canvas.toDataURL("image/jpeg",.86),"JPEG",0,0,210,297,undefined,"FAST");
    pdf.save(slugify(r.title)+"-tarifi.pdf");toast("PDF indirildi.");
  }catch(e){console.error(e);toast("PDF hazırlanamadı. Sayfayı yenileyip tekrar dene.")}
}
function coverHTML(title,count){
  return '<div class="pdf-cover-inner"><div class="pdf-flower top">✿ ❧ ✿</div><div class="pdf-brand">Anne Mutfağından Sana ♡</div>'+
  '<h1>'+escapeHtml(title)+'</h1><div class="cover-heart">♡</div><p>Ailemizin Sofra Mirası</p><p class="cover-small">'+count+' seçilmiş aile tarifi</p>'+
  '<div class="cover-ornament">❦ ✿ ❦</div><div class="pdf-flower bottom">Sevgiyle saklanan tarifler</div></div>';
}
async function downloadNotebookPDF(){
  const list=getFavs().map(recipeById).filter(Boolean);
  if(!list.length){toast("Önce birkaç tarifi favoriye ekle.");return}
  try{
    toast("Tarif defterin hazırlanıyor…");
    const {jsPDF}=window.jspdf||{};if(!jsPDF)throw new Error("PDF kütüphanesi yüklenemedi");
    const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
    const title=$("#bookTitle")?.value.trim()||"Annemden Bana Tarifler";
    const pages=[{html:coverHTML(title,list.length),cls:"pdf-cover"},...list.map(r=>({html:pdfRecipeHTML(r),cls:""}))];
    for(let i=0;i<pages.length;i++){
      const sheet=makeSheet(pages[i].html,pages[i].cls),canvas=await sheetCanvas(sheet);sheet.remove();
      if(i>0)pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg",.84),"JPEG",0,0,210,297,undefined,"FAST");
    }
    pdf.save(slugify(title||"tarif-defterim")+".pdf");toast("Tarif defterin indirildi. ♥");
  }catch(e){console.error(e);toast("PDF hazırlanamadı. Sayfayı yenileyip tekrar dene.")}
}
function previewNotebook(){
  const list=getFavs().map(recipeById).filter(Boolean);
  if(!list.length){toast("Önce birkaç tarifi favoriye ekle.");return}
  $(".preview-modal")?.remove();
  const title=$("#bookTitle")?.value.trim()||"Annemden Bana Tarifler";
  const modal=document.createElement("div");modal.className="preview-modal";
  modal.innerHTML='<div class="preview-box"><button class="preview-close" aria-label="Kapat">×</button><div class="preview-cover"><span>Aile Sofra Mirası</span><h2>'+escapeHtml(title)+'</h2><b>♡</b><p>'+list.length+' tarif</p></div>'+
    '<h3>Defterindeki Tarifler</h3><div class="preview-grid">'+list.map(r=>'<a href="tarif.html?id='+r.id+'">'+art(r.id,"preview-art")+'<strong>'+escapeHtml(r.title)+'</strong></a>').join("")+'</div>'+
    '<button class="btn primary preview-pdf">PDF Olarak İndir</button></div>';
  document.body.appendChild(modal);hydrateArt(modal);
  $(".preview-close",modal).onclick=()=>modal.remove();
  $(".preview-pdf",modal).onclick=()=>{modal.remove();downloadNotebookPDF()};
  modal.addEventListener("click",e=>{if(e.target===modal)modal.remove()});
}

document.addEventListener("DOMContentLoaded",()=>{
  navActive();bindHearts();globalSearch();bindMobileMenu();hydrateArt();updateFavUI();
  const p=document.body.dataset.page;
  if(p==="home")renderHome();
  if(p==="kategori")renderCategory();
  if(p==="tarif")renderDetail();
  if(p==="defterim"){renderDefterim();defterimEvents()}
});
