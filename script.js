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

  var email='alex.rivera@example.com', toast=document.getElementById('toast');
  document.getElementById('copy').addEventListener('click',function(){
    function done(m){toast.textContent=m}
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(email).then(function(){done('Copied: '+email)},function(){done('Email: '+email)});
    }else{done('Email: '+email)}
  });
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

  var notes=[];
  try{
    var sv=JSON.parse(localStorage.getItem('gb')||'null');
    if(Array.isArray(sv)){
      notes=sv.filter(function(x){
        return !((x.n==='Ms. Patel'&&x.m==='The lunch menu app is brilliant. Please never go back to the PDF!')||
          (x.n==='Jordan'&&x.m==='Your robotics logo is on my laptop now.'));
      });
      if(notes.length!==sv.length)localStorage.setItem('gb',JSON.stringify(notes));
    }
  }catch(e){}
  var box=document.getElementById('notes');
  function draw(){
    box.textContent='';
    notes.forEach(function(x,i){
      var d=document.createElement('div');d.className='note';d.style.setProperty('--r',((i*37%7)-3)+'deg');
      d.appendChild(document.createTextNode(x.m));var b=document.createElement('b');b.textContent='– '+x.n;d.appendChild(b);box.appendChild(d);
    });
  }
  draw();
  document.getElementById('gbf').addEventListener('submit',function(e){
    e.preventDefault();
    var n=document.getElementById('gn'),m=document.getElementById('gm');
    notes.unshift({n:n.value.trim(),m:m.value.trim()});notes=notes.slice(0,12);
    try{localStorage.setItem('gb',JSON.stringify(notes))}catch(x){}
    draw();n.value='';m.value='';
  });
})();