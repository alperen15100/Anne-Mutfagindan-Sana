
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const FAV_KEY="ams_favorites_v1";
const TITLE_KEY="ams_book_title_v1";

function recipeById(id){return (window.RECIPES||[]).find(r=>r.id===id)}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function slugify(s=""){return s.toLocaleLowerCase("tr-TR").replaceAll("ı","i").replaceAll("ğ","g").replaceAll("ü","u").replaceAll("ş","s").replaceAll("ö","o").replaceAll("ç","c").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}

function getFavs(){try{const v=JSON.parse(localStorage.getItem(FAV_KEY)||"[]");return Array.isArray(v)?[...new Set(v)].filter(id=>recipeById(id)):[]}catch{return []}}
function isFav(id){return getFavs().includes(id)}
function setFavs(v){try{localStorage.setItem(FAV_KEY,JSON.stringify(v));updateFavUI()}catch{toast("Tarif kaydedilemedi. Tarayıcının depolama iznini kontrol et.")}}
function toggleFav(id){
  if(!recipeById(id))return;
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
    b.innerHTML=b.classList.contains("heart-btn")?(on?"♥":"♡"):(on?"♥ Defterimde":"♡ Defterime Ekle");
    b.setAttribute("aria-label",on?"Defterden çıkar":"Defterime ekle");
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
  const r=recipeById(id);
  if(!r)return;
  el.style.backgroundImage='url("assets/recipes/'+r.id+'.jpg")';
  el.dataset.art=r.id;
  el.setAttribute("role","img");
  el.setAttribute("aria-label",r.title);
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
    nav.addEventListener("click",e=>{if(e.target.closest("a")){nav.classList.remove("open");menu.setAttribute("aria-expanded","false")}});
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
  const featured=recipeById("mercimek-corbasi")||window.RECIPES[0];
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

  const newRecipes=["kuru-fasulye","tavuk-sote","yayla-corbasi","patatesli-borek","kisir","mozaik-pasta"].map(recipeById).filter(Boolean);
  const newGrid=$("#newRecipesGrid");
  if(newGrid)newGrid.innerHTML=newRecipes.map(compactCard).join("");
  $$("[data-recipe-count]").forEach(el=>el.textContent=(window.RECIPES||[]).length);

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
      grid.innerHTML=sorted.length?sorted.map(compactCard).join(""):'<div class="empty-state"><h3>Tarif bulunamadı</h3><p>Başka bir arama deneyebilirsin.</p></div>';
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

let pdfBusy=false;
let pdfFont;
async function makePDF(){
  const jsPDF=window.jspdf?.jsPDF;
  if(!jsPDF)throw new Error("PDF bileşeni yüklenemedi");
  if(!pdfFont){
    const response=await fetch("assets/vendor/tarif-font.ttf");
    if(!response.ok)throw new Error("Yazı tipi yüklenemedi");
    const bytes=new Uint8Array(await response.arrayBuffer());
    let binary="";for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    pdfFont=btoa(binary);
  }
  const pdf=new jsPDF({unit:"mm",format:"a4",compress:true});
  pdf.addFileToVFS("Tarif.ttf",pdfFont);pdf.addFont("Tarif.ttf","Tarif","normal");pdf.setFont("Tarif");
  return pdf;
}
function pdfBase(pdf){
  pdf.setFillColor(255,253,248);pdf.rect(0,0,210,297,"F");
  pdf.setDrawColor(224,215,201);pdf.rect(12,12,186,273);
  pdf.setTextColor(89,105,76);pdf.setFontSize(9);pdf.text("ANNE MUTFAĞINDAN SANA",21,24);
}
async function pdfRecipe(pdf,r){
  pdfBase(pdf);let y=40;
  const text=(value,size=11,color=[48,44,38],gap=5)=>{
    pdf.setFontSize(size);pdf.setTextColor(...color);
    const lines=pdf.splitTextToSize(String(value),168);
    for(const line of lines){if(y+gap>269){pdf.addPage();pdfBase(pdf);y=38;}pdf.text(line,21,y);y+=gap;}
    y+=1;
  };
  text(r.title,23,[163,79,67],10);
  text(r.category+"  ·  "+r.time+"  ·  "+r.servings,9,[117,110,100],5);
  try{
    const im=new Image();im.src="assets/recipes/"+r.id+".jpg";await im.decode();
    const canvas=document.createElement("canvas");canvas.width=900;canvas.height=300;
    const ctx=canvas.getContext("2d");const scale=Math.max(900/im.width,300/im.height);
    ctx.drawImage(im,(900-im.width*scale)/2,(300-im.height*scale)/2,im.width*scale,im.height*scale);
    pdf.addImage(canvas.toDataURL("image/jpeg",.85),"JPEG",21,y,168,56);y+=64;
  }catch{ /* The recipe remains downloadable if its image fails. */ }
  text("Malzemeler",15,[89,105,76],7);
  r.ingredients.forEach(x=>text("• "+x,10,[48,44,38],4.8));y+=3;
  text("Yapılışı",15,[89,105,76],7);
  r.steps.forEach((x,i)=>text((i+1)+". "+x,10,[48,44,38],4.8));y+=3;
  text("Püf noktası",13,[163,79,67],6);text(r.tip,10,[48,44,38],5);
  text("Sofra notu",13,[163,79,67],6);text(r.note,10,[48,44,38],5);
}
async function saveRecipeBook(list,title,cover){
  if(pdfBusy)return;
  if(!list.length){toast("Önce birkaç tarifi defterine ekle");return;}
  pdfBusy=true;
  const buttons=$$("button[onclick*='PDF']");buttons.forEach(b=>b.disabled=true);
  try{
    toast("PDF hazırlanıyor…");const pdf=await makePDF();
    if(cover){
      pdfBase(pdf);pdf.setTextColor(163,79,67);pdf.setFontSize(32);
      const lines=pdf.splitTextToSize(title,155);pdf.text(lines,105,115,{align:"center",lineHeightFactor:1.25});
      pdf.setFontSize(12);pdf.setTextColor(89,105,76);pdf.text(list.length+" tarif · Senin seçimin, senin defterin",105,190,{align:"center"});
      pdf.setFontSize(10);pdf.text("Sevdiklerinle paylaşacağın sofralara…",105,205,{align:"center"});
    }
    for(let i=0;i<list.length;i++){if(cover||i)pdf.addPage();await pdfRecipe(pdf,list[i]);}
    const count=pdf.getNumberOfPages();
    for(let n=1;n<=count;n++){pdf.setPage(n);pdf.setFontSize(8);pdf.setTextColor(117,110,100);pdf.text(n+" / "+count,189,279,{align:"right"});}
    pdf.save(slugify(title)+".pdf");toast("PDF indirildi");
  }catch(e){console.error(e);toast("PDF hazırlanamadı. Sayfayı yenileyip tekrar dene.");}
  finally{pdfBusy=false;buttons.forEach(b=>b.disabled=false);}
}
function downloadRecipePDF(){const r=getRecipe();return saveRecipeBook([r],r.title+" Tarifi",false);}
function downloadNotebookPDF(){return saveRecipeBook(getFavs().map(recipeById).filter(Boolean),$("#bookTitle")?.value.trim()||"Benim Tarif Defterim",true);}
function previewNotebook(){
  const list=getFavs().map(recipeById).filter(Boolean);
  if(!list.length){toast("Önce tarif ekle");return}
  $(".preview-modal")?.remove();
  const title=$("#bookTitle")?.value.trim()||"Annemden Bana Tarifler";
  const modal=document.createElement("div");modal.className="preview-modal";
  modal.innerHTML='<div class="preview-dialog"><button class="modal-close">×</button><div class="preview-cover"><span>Anne Mutfağından Sana</span><h2>'+escapeHtml(title)+'</h2><b>♡</b><p>'+list.length+' tarif</p></div><div class="preview-list">'+list.map(miniCard).join("")+'</div><button class="btn primary modal-pdf">PDF Olarak İndir</button></div>';
  modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.setAttribute("aria-label","Tarif defteri önizlemesi");document.body.appendChild(modal);hydrateArt(modal);$(".modal-close",modal).focus();
  modal.addEventListener("keydown",e=>{if(e.key==="Escape")modal.remove();if(e.key==="Tab"){const els=$$("button,a",modal);const first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
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

window.addEventListener("storage",e=>{if(e.key===FAV_KEY){updateFavUI();if(document.body.dataset.page==="defterim")renderNotebook();}});
