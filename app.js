
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const FAV_KEY="ams_favorites_v1";
const TITLE_KEY="ams_book_title_v1";

const ART={
  "mercimek-corbasi":[0,0],
  "ezogelin":[1,0],
  "menemen":[2,0],
  "yaprak-sarma":[3,0],
  "pogaca":[4,0],
  "revani":[0,1],
  "sutlac":[1,1],
  "krep":[2,1],
  "firin-makarna":[3,1],
  "imam-bayildi":[4,1],
  "patates-salatasi":[0,2],
  "pirinc-pilavi":[1,2],
  "havuc-tarator":[2,2],
  "elmali-kurabiye":[3,2],
  "su-boregi":[4,2]
};

function recipeById(id){return (window.RECIPES||[]).find(r=>r.id===id)}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function slugify(s=""){return s.toLocaleLowerCase("tr-TR").replaceAll("ı","i").replaceAll("ğ","g").replaceAll("ü","u").replaceAll("ş","s").replaceAll("ö","o").replaceAll("ç","c").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}

function getFavs(){try{return JSON.parse(localStorage.getItem(FAV_KEY)||"[]")}catch{return []}}
function isFav(id){return getFavs().includes(id)}
function setFavs(v){localStorage.setItem(FAV_KEY,JSON.stringify(v));updateFavUI()}
function toggleFav(id){
  let favs=getFavs();
  if(favs.includes(id)){favs=favs.filter(x=>x!==id);toast("Defterden çıkarıldı")}
  else{favs.unshift(id);toast("Benim Defterim'e eklendi ♥")}
  setFavs(favs);
  if(document.body.dataset.page==="defterim") renderNotebook();
}
function toast(msg){
  let t=$("#toast");
  if(!t){t=document.createElement("div");t.id="toast";t.className="toast";document.body.appendChild(t)}
  t.textContent=msg;t.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast=setTimeout(()=>t.classList.remove("show"),1800);
}
function updateFavUI(){
  const favs=getFavs();
  $$("[data-fav-count]").forEach(x=>x.textContent=favs.length?String(favs.length):"");
  $$("[data-heart]").forEach(b=>{
    const on=isFav(b.dataset.heart);
    b.classList.toggle("active",on);
    b.setAttribute("aria-pressed",on?"true":"false");
    b.innerHTML=on?"♥":"♡";
  });
  const detail=$("#detailHeart");
  if(detail&&detail.dataset.id){
    const on=isFav(detail.dataset.id);
    detail.classList.toggle("active",on);
    detail.innerHTML=on?"♥ Defterimde":"♡ Defterime Ekle";
  }
}

function setArt(el,id){
  if(!el)return;
  const p=ART[id]||ART["mercimek-corbasi"];
  el.style.setProperty("--c",p[0]);
  el.style.setProperty("--r",p[1]);
  el.dataset.art=id;
}
function art(id,cls=""){
  const r=recipeById(id);
  return '<div class="dish-art '+cls+'" data-art="'+escapeHtml(id)+'" role="img" aria-label="'+escapeHtml(r?.title||"Tarif görseli")+'"></div>';
}
function hydrateArt(root=document){$$("[data-art]",root).forEach(el=>setArt(el,el.dataset.art))}

function compactCard(r){
  return '<article class="recipe-card">'+
    '<a class="recipe-card-media" href="tarif.html?id='+encodeURIComponent(r.id)+'">'+art(r.id,"card-art")+'</a>'+
    '<div class="recipe-card-copy">'+
      '<div class="eyebrow">'+escapeHtml(r.category)+'</div>'+
      '<a class="recipe-card-title" href="tarif.html?id='+encodeURIComponent(r.id)+'">'+escapeHtml(r.title)+'</a>'+
      '<p>'+escapeHtml(r.desc)+'</p>'+
      '<div class="recipe-card-meta"><span>◷ '+escapeHtml(r.time)+'</span><span>•</span><span>'+escapeHtml(r.difficulty||"Kolay")+'</span></div>'+
    '</div>'+
    '<button class="heart-btn '+(isFav(r.id)?"active":"")+'" data-heart="'+escapeHtml(r.id)+'" aria-label="Favoriye ekle" aria-pressed="'+(isFav(r.id)?"true":"false")+'">'+(isFav(r.id)?"♥":"♡")+'</button>'+
  '</article>';
}

function miniCard(r){
  return '<a class="mini-recipe" href="tarif.html?id='+encodeURIComponent(r.id)+'">'+
    art(r.id,"mini-dish")+
    '<div><strong>'+escapeHtml(r.title)+'</strong><span>'+escapeHtml(r.time)+' · '+escapeHtml(r.category)+'</span></div>'+
  '</a>';
}

function bindGlobal(){
  document.addEventListener("click",e=>{
    const heart=e.target.closest("[data-heart]");
    if(heart){e.preventDefault();toggleFav(heart.dataset.heart);return}
    const remove=e.target.closest("[data-remove]");
    if(remove){e.preventDefault();toggleFav(remove.dataset.remove);return}
  });

  const menu=$("#menuBtn"),nav=$("#mainNav");
  if(menu&&nav){
    menu.addEventListener("click",()=>{nav.classList.toggle("open");menu.setAttribute("aria-expanded",nav.classList.contains("open")?"true":"false")});
    nav.addEventListener("click",e=>{if(e.target.closest("a"))nav.classList.remove("open")});
  }

  $$("[data-search]").forEach(input=>{
    input.addEventListener("keydown",e=>{
      if(e.key==="Enter"&&input.value.trim()) location.href="kategori.html?q="+encodeURIComponent(input.value.trim());
    });
  });

  const page=document.body.dataset.page;
  $$("[data-nav]").forEach(a=>a.classList.toggle("active",a.dataset.nav===page));
  hydrateArt();updateFavUI();
}

function renderHome(){
  const featured=recipeById("krep")||window.RECIPES[0];
  const f=$("#featuredRecipe");
  if(f){
    f.innerHTML=
      '<div class="featured-media">'+art(featured.id,"featured-art")+'<span class="featured-badge">Bugünün tarifi</span></div>'+
      '<div class="featured-copy"><div class="eyebrow">'+escapeHtml(featured.category)+'</div><h3>'+escapeHtml(featured.title)+'</h3>'+
      '<p>'+escapeHtml(featured.desc)+'</p>'+
      '<div class="featured-meta"><span>◷ '+escapeHtml(featured.time)+'</span><span>'+escapeHtml(featured.servings||"4 kişilik")+'</span><span>'+escapeHtml(featured.difficulty||"Kolay")+'</span></div>'+
      '<div class="actions"><a class="btn primary" href="tarif.html?id='+featured.id+'">Tarifi Aç</a><button class="btn ghost" data-heart="'+featured.id+'">'+(isFav(featured.id)?"♥ Defterimde":"♡ Defterime Ekle")+'</button></div></div>';
  }

  const popular=["mercimek-corbasi","yaprak-sarma","pogaca","revani","menemen","firin-makarna"]
    .map(recipeById).filter(Boolean);
  const pg=$("#popularGrid");
  if(pg) pg.innerHTML=popular.map(compactCard).join("");

  const latest=(window.RECIPES||[]).slice(-5).reverse();
  const lg=$("#latestStrip");
  if(lg) lg.innerHTML=latest.map(miniCard).join("");

  hydrateArt();updateFavUI();
}

function categories(){
  return [...new Set((window.RECIPES||[]).map(r=>r.category))];
}
function renderCategoryPills(root,active=""){
  if(!root)return;
  root.innerHTML=
    '<a class="filter-pill '+(!active?"active":"")+'" href="kategori.html">Tümü</a>'+
    categories().map(c=>'<a class="filter-pill '+(c===active?"active":"")+'" href="kategori.html?cat='+encodeURIComponent(c)+'">'+escapeHtml(c)+'</a>').join("");
}

function renderCategory(){
  const params=new URLSearchParams(location.search);
  const q=(params.get("q")||"").trim();
  const cat=params.get("cat")||"";
  const qLower=q.toLocaleLowerCase("tr-TR");
  let list=[...(window.RECIPES||[])];

  if(cat) list=list.filter(r=>r.category===cat);
  if(qLower) list=list.filter(r=>(r.title+" "+r.category+" "+r.desc+" "+r.ingredients.join(" ")).toLocaleLowerCase("tr-TR").includes(qLower));

  const title=$("#archiveTitle"),sub=$("#archiveSub");
  if(title) title.textContent=q?("“"+q+"” için tarifler"):(cat||"Tüm Tarifler");
  if(sub) sub.textContent=list.length+" tarif bulundu";
  renderCategoryPills($("#categoryPills"),cat);

  const grid=$("#archiveGrid");
  if(grid) grid.innerHTML=list.length?list.map(compactCard).join(""):'<div class="empty-state"><span>♡</span><h3>Tarif bulunamadı</h3><p>Başka bir arama deneyebilirsin.</p></div>';

  const sort=$("#sortSelect");
  if(sort){
    sort.onchange=()=>{
      const v=sort.value;
      const sorted=[...list];
      if(v==="time") sorted.sort((a,b)=>(parseInt(a.time)||99)-(parseInt(b.time)||99));
      if(v==="rating") sorted.sort((a,b)=>Number(b.rating)-Number(a.rating));
      if(v==="az") sorted.sort((a,b)=>a.title.localeCompare(b.title,"tr"));
      grid.innerHTML=sorted.map(compactCard).join("");
      hydrateArt();updateFavUI();
    };
  }

  const archiveSearch=$("#archiveSearch");
  if(archiveSearch){
    archiveSearch.value=q;
    archiveSearch.addEventListener("keydown",e=>{
      if(e.key==="Enter"){
        const val=archiveSearch.value.trim();
        location.href=val?"kategori.html?q="+encodeURIComponent(val):"kategori.html";
      }
    });
  }

  hydrateArt();updateFavUI();
}

function getRecipe(){
  const id=new URLSearchParams(location.search).get("id")||"mercimek-corbasi";
  return recipeById(id)||window.RECIPES[0];
}
function renderDetail(){
  const r=getRecipe();
  document.title=r.title+" | Anne Mutfağından Sana";
  setArt($("#detailArt"),r.id);
  $("#detailCategory").textContent=r.category;
  $("#detailTitle").textContent=r.title;
  $("#detailDesc").textContent=r.desc;
  $("#detailTime").textContent=r.time;
  $("#detailServings").textContent=r.servings||"4–6 kişilik";
  $("#detailDifficulty").textContent=r.difficulty||"Kolay";
  $("#detailRating").textContent=r.rating;
  const hb=$("#detailHeart");hb.dataset.id=r.id;
  $("#ingredients").innerHTML=r.ingredients.map(x=>'<label class="ingredient"><input type="checkbox"><span>'+escapeHtml(x)+'</span></label>').join("");
  $("#steps").innerHTML=r.steps.map((x,i)=>'<div class="step-row"><div class="step-no">'+(i+1)+'</div><p>'+escapeHtml(x)+'</p></div>').join("");
  $("#tipText").textContent=r.tip;
  $("#noteText").textContent=r.note;

  const rel=(window.RECIPES||[]).filter(x=>x.id!==r.id&&x.category===r.category).slice(0,3);
  const related=rel.length?rel:(window.RECIPES||[]).filter(x=>x.id!==r.id).slice(0,3);
  $("#relatedGrid").innerHTML=related.map(compactCard).join("");

  hydrateArt();updateFavUI();
}

function renderNotebook(){
  const favs=getFavs();
  const list=favs.map(recipeById).filter(Boolean);
  $("#notebookCount").textContent=list.length;
  const root=$("#notebookList");
  if(root){
    root.innerHTML=list.length?list.map(r=>
      '<article class="notebook-item">'+
        art(r.id,"notebook-art")+
        '<div><div class="eyebrow">'+escapeHtml(r.category)+'</div><a href="tarif.html?id='+r.id+'"><strong>'+escapeHtml(r.title)+'</strong></a><span>'+escapeHtml(r.time)+' · '+escapeHtml(r.difficulty||"Kolay")+'</span></div>'+
        '<button class="remove-btn" data-remove="'+r.id+'" aria-label="Defterden çıkar">×</button>'+
      '</article>'
    ).join(""):'<div class="empty-state"><span>♡</span><h3>Defterin henüz boş</h3><p>Sevdiğin tariflerdeki kalbe dokun; burada biriksin.</p><a class="btn primary" href="kategori.html">Tarifleri Keşfet</a></div>';
  }

  const title=$("#bookTitle");
  const saved=localStorage.getItem(TITLE_KEY)||"Annemden Bana Tarifler";
  if(title){title.value=saved;title.oninput=()=>{localStorage.setItem(TITLE_KEY,title.value);$("#coverTitle").textContent=title.value||"Benim Tarif Defterim"}}
  $("#coverTitle").textContent=saved;
  $("#coverCount").textContent=list.length+" seçilmiş tarif";

  const preview=$("#notebookPreview");
  if(preview) preview.innerHTML=list.slice(0,4).map(r=>art(r.id,"preview-tile")).join("");

  hydrateArt();updateFavUI();
}

function printPage(){window.print()}

function recipeSheetHTML(r){
  return '<div class="pdf-brand">Anne Mutfağından Sana</div>'+
    '<div class="pdf-ornament">❦</div>'+
    '<h1>'+escapeHtml(r.title)+'</h1>'+
    art(r.id,"pdf-dish")+
    '<div class="pdf-meta"><span>'+escapeHtml(r.category)+'</span><span>◷ '+escapeHtml(r.time)+'</span><span>'+escapeHtml(r.servings||"")+'</span></div>'+
    '<div class="pdf-columns"><section><h2>Malzemeler</h2><ul>'+r.ingredients.map(x=>'<li>'+escapeHtml(x)+'</li>').join("")+'</ul></section>'+
    '<section><h2>Yapılışı</h2><ol>'+r.steps.map(x=>'<li>'+escapeHtml(x)+'</li>').join("")+'</ol></section></div>'+
    '<div class="pdf-notes"><p><b>Püf Noktası</b> '+escapeHtml(r.tip)+'</p><p><b>Anne Notu</b> '+escapeHtml(r.note)+'</p></div>'+
    '<div class="pdf-footer">♡ Afiyet olsun ♡</div>';
}
function coverSheetHTML(title,count){
  return '<div class="pdf-cover-inner"><div class="pdf-brand">Anne Mutfağından Sana</div><div class="pdf-ornament big">❦</div>'+
    '<h1>'+escapeHtml(title)+'</h1><p>Ailemizin Sofra Mirası</p><span>'+count+' seçilmiş tarif</span><div class="pdf-cover-heart">♡</div></div>';
}
function makeSheet(html,cls=""){
  const el=document.createElement("div");
  el.className="pdf-sheet "+cls;el.innerHTML=html;document.body.appendChild(el);hydrateArt(el);return el;
}
async function sheetCanvas(el){
  if(!window.html2canvas)throw new Error("html2canvas yok");
  if(document.fonts?.ready)await document.fonts.ready;
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  return html2canvas(el,{scale:1.45,backgroundColor:"#fffaf2",logging:false,useCORS:true});
}
async function downloadRecipePDF(){
  const r=getRecipe();
  try{
    toast("PDF hazırlanıyor…");
    const {jsPDF}=window.jspdf||{};if(!jsPDF)throw new Error("jsPDF yok");
    const sheet=makeSheet(recipeSheetHTML(r));
    const canvas=await sheetCanvas(sheet);sheet.remove();
    const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
    pdf.addImage(canvas.toDataURL("image/jpeg",.88),"JPEG",0,0,210,297,undefined,"FAST");
    pdf.save(slugify(r.title)+"-tarifi.pdf");
    toast("PDF indirildi");
  }catch(e){console.error(e);toast("PDF hazırlanamadı")}
}
async function downloadNotebookPDF(){
  const list=getFavs().map(recipeById).filter(Boolean);
  if(!list.length){toast("Önce birkaç tarifi defterine ekle");return}
  try{
    toast("Defter hazırlanıyor…");
    const {jsPDF}=window.jspdf||{};if(!jsPDF)throw new Error("jsPDF yok");
    const title=$("#bookTitle")?.value.trim()||"Annemden Bana Tarifler";
    const pages=[{html:coverSheetHTML(title,list.length),cls:"pdf-cover"},...list.map(r=>({html:recipeSheetHTML(r),cls:""}))];
    const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
    for(let i=0;i<pages.length;i++){
      const sheet=makeSheet(pages[i].html,pages[i].cls);
      const canvas=await sheetCanvas(sheet);sheet.remove();
      if(i)pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg",.86),"JPEG",0,0,210,297,undefined,"FAST");
    }
    pdf.save(slugify(title)+".pdf");toast("Tarif defteri indirildi");
  }catch(e){console.error(e);toast("PDF hazırlanamadı")}
}
function previewNotebook(){
  const list=getFavs().map(recipeById).filter(Boolean);
  if(!list.length){toast("Önce tarif ekle");return}
  $(".preview-modal")?.remove();
  const title=$("#bookTitle")?.value.trim()||"Annemden Bana Tarifler";
  const modal=document.createElement("div");modal.className="preview-modal";
  modal.innerHTML='<div class="preview-dialog"><button class="modal-close">×</button><div class="preview-cover"><span>Anne Mutfağından Sana</span><h2>'+escapeHtml(title)+'</h2><b>♡</b><p>'+list.length+' tarif</p></div><div class="preview-list">'+list.map(miniCard).join("")+'</div><button class="btn primary modal-pdf">PDF Olarak İndir</button></div>';
  document.body.appendChild(modal);hydrateArt(modal);
  $(".modal-close",modal).onclick=()=>modal.remove();
  $(".modal-pdf",modal).onclick=()=>{modal.remove();downloadNotebookPDF()};
  modal.onclick=e=>{if(e.target===modal)modal.remove()};
}

document.addEventListener("DOMContentLoaded",()=>{
  bindGlobal();
  const p=document.body.dataset.page;
  if(p==="home")renderHome();
  if(p==="kategori")renderCategory();
  if(p==="tarif")renderDetail();
  if(p==="defterim")renderNotebook();
});
