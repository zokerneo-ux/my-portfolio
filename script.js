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

  var commentForm=document.getElementById('comment-form');
  var commentList=document.getElementById('comment-list');
  var commentStatus=document.getElementById('comment-status');
  var commentName=document.getElementById('comment-name');
  var commentText=document.getElementById('comment-text');
  var commentSubmit=commentForm.querySelector('button[type="submit"]');
  var commentsApi='https://sheetdb.io/api/v1/vigiabnq33hmu';
  var comments=[];
  var commentsRequest=null;
  var pendingCommentDeletes=new Set();
  var pendingCommentLikes=new Set();

  function validComments(rows){
    if(!Array.isArray(rows))throw new Error('Unexpected comments response');
    return rows.filter(function(row){
      return row&&typeof row.name==='string'&&typeof row.comment==='string';
    }).map(function(row){
      return {
        id:typeof row.id==='string'||typeof row.id==='number'?String(row.id).trim():'',
        name:row.name.trim(),
        text:row.comment.trim(),
        likes:Number.isFinite(Number(row.likes))&&Number(row.likes)>=0?Math.floor(Number(row.likes)):0
      };
    }).filter(function(comment){
      return comment.name&&comment.text;
    });
  }
  function createCommentId(){
    if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();
    if(window.crypto&&typeof window.crypto.getRandomValues==='function'){
      return Array.from(window.crypto.getRandomValues(new Uint32Array(4)),function(value){
        return value.toString(16);
      }).join('-');
    }
    return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  }
  function renderComments(){
    commentList.textContent='';
    comments.forEach(function(comment){
      if(comment.id&&pendingCommentDeletes.has(comment.id))return;
      var article=document.createElement('article');
      article.className='comment';
      var text=document.createElement('p');
      text.textContent=comment.text;
      var author=document.createElement('b');
      author.className='comment-author';
      author.textContent='– '+comment.name;
      var content=document.createElement('div');
      content.className='comment-content';
      content.appendChild(text);
      content.appendChild(author);
      var actions=document.createElement('div');
      actions.className='comment-actions';
      var like=document.createElement('button');
      like.className='comment-like';
      like.type='button';
      like.textContent='Like ('+comment.likes+')';
      like.setAttribute('aria-label','Like '+comment.name+'’s comment, '+comment.likes+' likes');
      like.disabled=!comment.id||pendingCommentLikes.has(comment.id);
      like.addEventListener('click',function(){
        likeComment(comment);
      });
      actions.appendChild(like);
      var remove=document.createElement('button');
      remove.className='comment-delete';
      remove.type='button';
      remove.textContent=comment.id?'削除':'削除できません（IDなし）';
      remove.setAttribute('aria-label',comment.id?comment.name+'のコメントを削除':'IDがないコメントは削除できません');
      remove.disabled=!comment.id;
      remove.addEventListener('click',function(){
        deleteComment(comment);
      });
      article.appendChild(content);
      actions.appendChild(remove);
      article.appendChild(actions);
      commentList.appendChild(article);
    });
  }
  async function refreshComments(){
    if(commentsRequest)await commentsRequest;
    return loadComments();
  }
  function loadComments(){
    if(commentsRequest)return commentsRequest;
    commentsRequest=(async function(){
      try{
        var response=await fetch(commentsApi);
        if(!response.ok)throw new Error('Comments request failed with status '+response.status);
        var updatedComments=validComments(await response.json());
        updatedComments.forEach(function(comment){
          if(!pendingCommentLikes.has(comment.id))return;
          var current=comments.find(function(item){return item.id===comment.id});
          if(current)comment.likes=current.likes;
        });
        comments=updatedComments;
        renderComments();
        if(commentStatus.textContent==='コメントを読み込んでいます...'||
          commentStatus.textContent==='コメントを読み込めませんでした。時間をおいてページを再読み込みしてください。'){
          commentStatus.textContent='';
        }
        return true;
      }catch(error){
        commentStatus.textContent='コメントを読み込めませんでした。時間をおいてページを再読み込みしてください。';
        return false;
      }finally{
        commentsRequest=null;
      }
    })();
    return commentsRequest;
  }
  commentStatus.textContent='コメントを読み込んでいます...';
  loadComments();
  setInterval(function(){
    if(!document.hidden)loadComments();
  },5000);
  document.addEventListener('visibilitychange',function(){
    if(!document.hidden)loadComments();
  });
  async function deleteComment(comment){
    if(!comment.id){
      commentStatus.textContent='このコメントには一意のIDがないため削除できません。';
      return;
    }
    if(pendingCommentDeletes.has(comment.id))return;
    pendingCommentDeletes.add(comment.id);
    renderComments();
    commentStatus.textContent='コメントを削除しています...';
    try{
      var response=await fetch(commentsApi+'/id/'+encodeURIComponent(comment.id)+'?limit=1&casesensitive=true',{
        method:'DELETE'
      });
      if(!response.ok)throw new Error('Comment deletion failed with status '+response.status);
      comments=comments.filter(function(item){return item.id!==comment.id});
      pendingCommentDeletes.delete(comment.id);
      renderComments();
      var refreshed=await refreshComments();
      commentStatus.textContent=refreshed
        ?'コメントを削除しました。'
        :'コメントを削除しましたが、一覧を更新できませんでした。';
    }catch(error){
      pendingCommentDeletes.delete(comment.id);
      await refreshComments();
      commentStatus.textContent='コメントを削除できませんでした。時間をおいてもう一度お試しください。';
    }
  }
  async function likeComment(comment){
    if(!comment.id||pendingCommentLikes.has(comment.id))return;
    pendingCommentLikes.add(comment.id);
    comment.likes+=1;
    renderComments();
    try{
      var response=await fetch(commentsApi+'/id/'+encodeURIComponent(comment.id)+'?casesensitive=true',{
        method:'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({data:{likes:comment.likes}})
      });
      if(!response.ok)throw new Error('Like update failed with status '+response.status);
      var result=await response.json();
      if(typeof result.updated==='number'&&result.updated<1)throw new Error('No comment was updated');
      commentStatus.textContent='いいねしました。';
      pendingCommentLikes.delete(comment.id);
      await refreshComments();
    }catch(error){
      comment.likes=Math.max(0,comment.likes-1);
      pendingCommentLikes.delete(comment.id);
      renderComments();
      commentStatus.textContent='いいねを保存できませんでした。時間をおいてもう一度お試しください。';
      await refreshComments();
    }
  }
  commentForm.addEventListener('submit',function(event){
    event.preventDefault();
    var name=commentName.value.trim();
    var text=commentText.value.trim();
    if(!name||!text)return;
    commentSubmit.disabled=true;
    commentStatus.textContent='コメントを投稿しています...';
    var id=createCommentId();
    fetch(commentsApi,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({data:{id:id,name:name,comment:text,likes:0}})
    }).then(function(response){
      if(!response.ok)throw new Error('Comment submission failed with status '+response.status);
      comments.unshift({id:id,name:name,text:text,likes:0});
      renderComments();
      commentName.value='';
      commentText.value='';
      return refreshComments().then(function(loaded){
        commentStatus.textContent=loaded
          ?'コメントを投稿しました。'
          :'コメントを投稿しましたが、最新の一覧を読み込めませんでした。';
      });
    }).catch(function(error){
      commentStatus.textContent='コメントを投稿できませんでした。時間をおいてもう一度お試しください。';
    }).then(function(){
      commentSubmit.disabled=false;
    });
  });
})();