/* ============================================================
   SMILO — friends.js
   ============================================================ */
function authHeaders(){
  const token = localStorage.getItem('smilo_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function initFriendsPage(){
  if(currentPageName() !== 'friends.html') return;
  renderFriendsPage();
  document.getElementById('friends-search')?.addEventListener('input', renderFriendsPage);
}

async function renderFriendsPage(){
  const el = document.getElementById('friends-body');
  if(!el) return;
  const query = (document.getElementById('friends-search')?.value || '').trim().toLowerCase();

  try {
    const res = await fetch('/api/friends', { headers: authHeaders() });
    let friends = res.ok ? await res.json() : [];

    document.getElementById('friends-count').textContent = friends.length;

    if(query) friends = friends.filter(u=>u.name.toLowerCase().includes(query) || u.userName.toLowerCase().includes(query));

    el.innerHTML = friends.length
      ? `<div class="people-grid">${friends.map(friendCardHTML).join('')}</div>`
      : `<div class="card empty-state"><div class="icon-circle"><i class="fa-solid fa-user-group"></i></div><h4>Your circle is waiting</h4><p>Head to Discover to find people with shared interests.</p><a href="discover.html" class="btn btn-primary btn-sm" style="margin-top:14px;">Discover People</a></div>`;
  } catch (err) {
    el.innerHTML = `<div class="card empty-state"><h4>Could not reach the server</h4></div>`;
  }
}

function friendCardHTML(u){
  return `
  <div class="card person-card">
    <img src="${u.avatarUrl}" class="avatar avatar-64" style="margin:0 auto 10px;" alt="">
    <b>${escapeHTML(u.name)}</b>
    <div style="font-size:12px;color:var(--text-faint);">@${escapeHTML(u.userName)}</div>
    <p class="bio">${escapeHTML(u.bio || '')}</p>
    <div class="meta"><i class="fa-solid fa-face-smile"></i> ${u.smilePoint} pts</div>
    <div class="actions">
      <a href="chat.html?u=${u.userId}" class="btn btn-primary btn-sm"><i class="fa-solid fa-message"></i> Chat</a>
      <button class="btn btn-outline btn-sm" data-remove-friend="${u.userId}"><i class="fa-solid fa-user-minus"></i></button>
    </div>
  </div>`;
}

document.addEventListener('click', async (e)=>{
  const removeBtn = e.target.closest('[data-remove-friend]');
  if(removeBtn && currentPageName()==='friends.html'){
    if(confirm('Remove this friend?')){
      try {
        const res = await fetch(`/api/friends/${removeBtn.dataset.removeFriend}`, { method:'DELETE', headers: authHeaders() });
        if(res.ok || res.status===204){
          showToast('Friend removed.');
          renderFriendsPage();
          if(typeof renderNavbarStats==='function') renderNavbarStats();
        }
      } catch (err) { showToast('Could not reach the server.', 'error'); }
    }
  }
});

document.addEventListener('DOMContentLoaded', initFriendsPage);