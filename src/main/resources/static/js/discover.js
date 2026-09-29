/* ============================================================
   SMILO — discover.js
   Wired to /api/friends/* instead of the local Friends object.
   ============================================================ */
let discoverTab = 'discover';
let discoverQuery = '';

function authHeaders(){
  const token = localStorage.getItem('smilo_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function initDiscoverPage(){
  if(currentPageName() !== 'discover.html') return;
  const user = Session.current();
  if(!user) return;

  if(location.hash === '#requests') discoverTab = 'requests';

  renderDiscoverTabs();
  renderDiscoverBody();

  document.getElementById('discover-search')?.addEventListener('input', (e)=>{
    discoverQuery = e.target.value.trim().toLowerCase();
    renderDiscoverBody();
  });

  document.querySelector('[data-tab-group="discover"]')?.addEventListener('tabchange', (e)=>{
    discoverTab = e.detail.tab;
    renderDiscoverBody();
  });
}

function renderDiscoverTabs(){
  document.querySelectorAll('[data-tab-group="discover"] [data-tab]').forEach(t=>{
    t.classList.toggle('active', t.dataset.tab === discoverTab);
  });
}

async function renderDiscoverBody(){
  const el = document.getElementById('discover-body');
  if(!el) return;
  el.innerHTML = `<div class="card empty-state"><p>Loading…</p></div>`;

  try {
    if(discoverTab === 'discover'){
      const res = await fetch(`/api/friends/discover${discoverQuery ? `?query=${encodeURIComponent(discoverQuery)}` : ''}`, { headers: authHeaders() });
      const people = res.ok ? await res.json() : [];
      el.innerHTML = people.length ? `<div class="people-grid">${people.map(personCardHTML).join('')}</div>` : emptyState('fa-compass','No one matches your search','Try a different name or interest.');
    }

    if(discoverTab === 'friends'){
      const res = await fetch('/api/friends', { headers: authHeaders() });
      let people = res.ok ? await res.json() : [];
      if(discoverQuery) people = people.filter(u=>u.name.toLowerCase().includes(discoverQuery));
      el.innerHTML = people.length ? `<div class="people-grid">${people.map(personCardHTML).join('')}</div>` : emptyState('fa-user-group','Your circle is waiting','Send a few requests from the Discover tab.');
    }

    if(discoverTab === 'requests'){
      const res = await fetch('/api/friends/requests', { headers: authHeaders() });
      const reqs = res.ok ? await res.json() : [];
      el.innerHTML = reqs.length ? `<div class="people-grid">${reqs.map(requestCardHTML).join('')}</div>` : emptyState('fa-user-check',"You're all caught up",'No pending friend requests right now.');
    }

    if(discoverTab === 'sent'){
      const res = await fetch('/api/friends/sent', { headers: authHeaders() });
      const reqs = res.ok ? await res.json() : [];
      el.innerHTML = reqs.length ? `<div class="people-grid">${reqs.map(sentCardHTML).join('')}</div>` : emptyState('fa-paper-plane','No requests sent','People you invite will show up here.');
    }
  } catch (err) {
    el.innerHTML = emptyState('fa-triangle-exclamation','Could not reach the server','Try again in a moment.');
  }
}

function personCardHTML(u){
  const isFriend = u.relationship === 'FRIENDS';
  const pending = u.relationship === 'PENDING_SENT';
  return `
  <div class="card person-card">
    <img src="${u.avatarUrl}" class="avatar avatar-64" style="margin:0 auto 10px;" alt="">
    <b>${escapeHTML(u.name)}</b>
    <div style="font-size:12px;color:var(--text-faint);">@${escapeHTML(u.userName)}</div>
    <p class="bio">${escapeHTML(u.bio || '')}</p>
    <div class="meta"><i class="fa-solid fa-face-smile"></i> ${u.smilePoint} pts ${u.mutualFriends>0?`· ${u.mutualFriends} mutual`:''}</div>
    <div class="actions">
      ${isFriend
        ? `<a href="chat.html?u=${u.userId}" class="btn btn-secondary btn-sm"><i class="fa-solid fa-message"></i> Chat</a><button class="btn btn-outline btn-sm" data-remove-friend="${u.userId}"><i class="fa-solid fa-user-minus"></i></button>`
        : pending
          ? `<button class="btn btn-secondary btn-sm" disabled>Request Sent</button>`
          : `<button class="btn btn-primary btn-sm btn-block" data-add-friend="${u.userId}"><i class="fa-solid fa-user-plus"></i> Add Friend</button>`}
    </div>
  </div>`;
}

function requestCardHTML(r){
  return `
  <div class="card person-card">
    <img src="${r.avatarUrl}" class="avatar avatar-64" style="margin:0 auto 10px;" alt="">
    <b>${escapeHTML(r.name)}</b>
    <div style="font-size:12px;color:var(--text-faint);">@${escapeHTML(r.userName)}</div>
    <p class="bio">Wants to connect with you on SMILO.</p>
    <div class="actions">
      <button class="btn btn-primary btn-sm" data-accept-request="${r.requestId}"><i class="fa-solid fa-check"></i> Accept</button>
      <button class="btn btn-outline btn-sm" data-decline-request="${r.requestId}"><i class="fa-solid fa-xmark"></i> Decline</button>
    </div>
  </div>`;
}

function sentCardHTML(r){
  return `
  <div class="card person-card">
    <img src="${r.avatarUrl}" class="avatar avatar-64" style="margin:0 auto 10px;" alt="">
    <b>${escapeHTML(r.name)}</b>
    <div style="font-size:12px;color:var(--text-faint);">@${escapeHTML(r.userName)}</div>
    <div class="actions"><button class="btn btn-secondary btn-sm btn-block" disabled><i class="fa-solid fa-paper-plane"></i> Request Sent</button></div>
  </div>`;
}

function emptyState(icon, title, desc){
  return `<div class="card empty-state"><div class="icon-circle"><i class="fa-solid ${icon}"></i></div><h4>${title}</h4><p>${desc}</p></div>`;
}

document.addEventListener('click', async (e)=>{
  const addBtn = e.target.closest('[data-add-friend]');
  if(addBtn){
    addBtn.disabled = true;
    try {
      const res = await fetch(`/api/friends/request/${addBtn.dataset.addFriend}`, { method:'POST', headers: authHeaders() });
      const data = res.ok ? null : await res.json();
      if(res.ok){ showToast('Friend request sent.', 'success'); renderDiscoverBody(); if(typeof renderSuggestionsCard==='function'){ const user = Session.current(); renderSuggestionsCard(user); } }
      else { addBtn.disabled = false; showToast(data.message || 'Could not send request.', 'error'); }
    } catch (err) { addBtn.disabled = false; showToast('Could not reach the server.', 'error'); }
  }

  const acceptBtn = e.target.closest('[data-accept-request]');
  if(acceptBtn){
    try {
      const res = await fetch(`/api/friends/request/${acceptBtn.dataset.acceptRequest}/accept`, { method:'POST', headers: authHeaders() });
      if(res.ok){ showToast('Friend request accepted.', 'success'); renderDiscoverBody(); }
    } catch (err) { showToast('Could not reach the server.', 'error'); }
  }

  const declineBtn = e.target.closest('[data-decline-request]');
  if(declineBtn){
    try {
      const res = await fetch(`/api/friends/request/${declineBtn.dataset.declineRequest}/decline`, { method:'POST', headers: authHeaders() });
      if(res.ok){ showToast('Request declined.'); renderDiscoverBody(); }
    } catch (err) { showToast('Could not reach the server.', 'error'); }
  }

  const removeBtn = e.target.closest('[data-remove-friend]');
  if(removeBtn){
    if(confirm('Remove this friend?')){
      try {
        const res = await fetch(`/api/friends/${removeBtn.dataset.removeFriend}`, { method:'DELETE', headers: authHeaders() });
        if(res.ok || res.status===204){
          showToast('Friend removed.');
          renderDiscoverBody();
          if(typeof renderFriendsPage==='function') renderFriendsPage();
        }
      } catch (err) { showToast('Could not reach the server.', 'error'); }
    }
  }
});

document.addEventListener('DOMContentLoaded', initDiscoverPage);