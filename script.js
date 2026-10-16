(function(){
  var root=document.documentElement, tb=document.getElementById('theme');
  function dark(){return root.dataset.theme?root.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches}
  function label(){tb.textContent=dark()?'Light mode':'Dark mode'}
  try{var s=localStorage.getItem('theme');if(s)root.dataset.theme=s}catch(e){}
  label();
  tb.addEventListener('click',function(){
    root.dataset.theme=dark()?'light':'dark';label();
    try{localStorage.setItem('theme',root.dataset.theme)}catch(e){}
  });

  var btns=document.querySelectorAll('.filters button'), cards=document.querySelectorAll('.proj');
  btns.forEach(function(b){b.addEventListener('click',function(){
    btns.forEach(function(x){x.setAttribute('aria-pressed',x===b)});
    cards.forEach(function(c){c.hidden=c.dataset.c!==b.dataset.f});
  })});
})();

(function(){
  document.documentElement.classList.add('js');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bar=document.getElementById('bar');
  addEventListener('scroll',function(){var h=document.documentElement.scrollHeight-innerHeight;bar.style.width=(h>0?scrollY/h*100:0)+'%'},{passive:true});

  var lightbox=document.getElementById('lightbox');
  var lightboxImage=document.getElementById('lightbox-image');
  document.querySelectorAll('#projects .proj img, #av').forEach(function(img){
    img.tabIndex=0;
    img.setAttribute('role','button');
    img.setAttribute('aria-haspopup','dialog');
    img.addEventListener('click',function(){
      lightboxImage.src=img.src;
      lightboxImage.alt=img.alt;
      lightbox.showModal();
    });
    img.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();
        img.click();
      }
    });
  });
  document.getElementById('lightbox-close').addEventListener('click',function(){
    lightbox.close();
  });
  lightbox.addEventListener('click',function(e){
    if(e.target===lightbox)lightbox.close();
  });

  var words=['take photos.','build websites.','draw portraits and anime characters.'],t=document.getElementById('type'),wi=0,ci=0,del=false;
  function tick(){
    var w=words[wi];t.textContent=w.slice(0,ci);
    if(!del&&ci===w.length){del=true;return setTimeout(tick,1600)}
    if(del&&ci===0){del=false;wi=(wi+1)%words.length}
    ci+=del?-1:1;setTimeout(tick,del?40:80);
  }
  if(reduce){t.textContent=words[0]}else{tick()}
})();
