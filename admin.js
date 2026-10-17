(() => {
  Auth.renderUserArea(document.getElementById('userArea'));
  if (!Auth.isAdmin()) { document.getElementById('denied').hidden=false; return; }
  document.getElementById('adminContent').hidden=false;
  const form=document.getElementById('subAdminForm'), idInput=document.getElementById('subAdminId'), typeInput=document.getElementById('subAdminType'), msg=document.getElementById('subAdminMessage'), list=document.getElementById('subAdminList');
  const KEY='studentCouncilSubAdmins_demo';
  function read(){try{const v=JSON.parse(localStorage.getItem(KEY));return Array.isArray(v)?v:[]}catch{return []}}
  function render(){const items=read();list.innerHTML='';if(!items.length){list.innerHTML='<p class="empty-state">아직 설정한 하위 관리자가 없어.</p>';return;}items.forEach((item,index)=>{const row=document.createElement('div');row.className='assignment-row';const label=document.createElement('div');label.innerHTML=`<strong>${item.id}</strong><span class="muted">${item.type==='studentCouncil'?'학생회 임원':'동아리 부장'}</span><small>권한 미적용 · 테스트 목록</small>`;const del=document.createElement('button');del.className='text-button';del.textContent='목록에서 삭제';del.onclick=()=>{const next=read();next.splice(index,1);localStorage.setItem(KEY,JSON.stringify(next));render();};row.append(label,del);list.appendChild(row);});}
  form.addEventListener('submit',e=>{e.preventDefault();const id=idInput.value.trim();if(!/^\d{5}$/.test(id)){msg.textContent='학번은 숫자 5자리로 입력해 줘.';msg.className='message error';return;}if(id==='20304'){msg.textContent='최고 관리자 학번은 하위 관리자로 추가할 수 없어.';msg.className='message error';return;}const items=read();if(items.some(x=>x.id===id&&x.type===typeInput.value)){msg.textContent='같은 학번과 역할이 이미 등록돼 있어.';msg.className='message error';return;}items.push({id,type:typeInput.value});localStorage.setItem(KEY,JSON.stringify(items));idInput.value='';msg.textContent='테스트 목록에 추가했어. 실제 권한은 부여되지 않았어.';msg.className='message';render();});
  render();
})();
