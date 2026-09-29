/* ============================================================
   SMILO — home.js
   Feed, composer, and reactions now call the real backend
   at /api/thought instead of localStorage.
   ============================================================ */

const REACTIONS = [
  {key:'SMILE', icon:'fa-face-smile', label:'Made Me Smile'},
  {key:'INSPIRED', icon:'fa-lightbulb', label:'Inspired Me'},
  {key:'RELATABLE', icon:'fa-handshake', label:'Relatable'},
  {key:'WORTH_SHARING', icon:'fa-fire', label:'Worth Sharing'}
];

let currentFeedTab = 'global';

function authHeaders(){
  const token = localStorage.getItem('smilo_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function initHomePage(){
  if(currentPageName() !== 'home.html') return;
  const user = Session.current();
  if(!user) return;

  document.getElementById('greeting-name').textContent = user.name.split(' ')[0];

  renderPulseCard();
  renderComposer(user);
  renderFeed();
  renderRightSidebar(user);
  renderCommunityGoalCard();

  document.querySelector('[data-tab-group="feed"]')?.addEventListener('tabchange', (e)=>{
    currentFeedTab = e.detail.tab;
    renderFeed();
  });

  document.getElementById('open-smile-modal-btn')?.addEventListener('click', openSmileModal);
  document.getElementById('open-smile-modal-btn-2')?.addEventListener('click', openSmileModal);
}

function refreshHomeStats(){
  const user = Session.current();
  if(!user) return;
  renderPulseCard();
  renderRightSidebar(user);
  renderCommunityGoalCard();
}

function renderPulseCard(){
  const el = document.getElementById('pulse-card');
  if(!el) return;
  const s = GlobalStats.get();
  el.innerHTML = `
    <div class="pulse-top">
      <h3>GLOBAL SMILE PULSE</h3>
      <i class="fa-solid fa-chart-line"></i>
    </div>
    <div class="pulse-count"><i class="fa-solid fa-face-smile" style="font-size:26px;"></i> <span class="count-up" id="pulse-count-val">0</span></div>
    <div class="pulse-sub">Smiles collected today: ${s.smilesToday.toLocaleString()}</div>
    <div class="pulse-metrics">
      <div><b>${s.activeUsers.toLocaleString()}</b><span>Active users</span></div>
      <div><b>${s.thoughtsShared.toLocaleString()}</b><span>Thoughts shared</span></div>
      <div><b>${s.activeStreaks.toLocaleString()}</b><span>Active streaks</span></div>
    </div>
  `;
  animateCount(document.getElementById('pulse-count-val'), s.totalSmiles, 1100);
}

function renderComposer(user){
  const textarea = document.getElementById('composer-textarea');
  const charCount = document.getElementById('composer-char-count');
  const postBtn = document.getElementById('composer-post-btn');
  const visSelect = document.getElementById('composer-visibility');
  if(!textarea) return;

  textarea.addEventListener('input', ()=>{
    const len = textarea.value.length;
    charCount.textContent = `${len}/500`;
    postBtn.disabled = len === 0 || len > 500;
  });

  postBtn.addEventListener('click', async ()=>{
    const content = textarea.value.trim();
    if(!content) return;
    setButtonLoading(postBtn, true);

    try {
      const res = await fetch('/api/thought', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ content, visibility: visSelect.value.toUpperCase() })
      });
      const data = await res.json();

      if(!res.ok){
        setButtonLoading(postBtn, false);
        showToast(data.message || 'Could not post your thought.', 'error');
        return;
      }

      textarea.value='';
      charCount.textContent='0/500';
      setButtonLoading(postBtn, false);
      postBtn.disabled = true;
      showToast('Your thought was posted.', 'success');
      renderFeed();
      renderRightSidebar(user);
      renderNavbarStats();
    } catch (err) {
      setButtonLoading(postBtn, false);
      showToast('Could not reach the server.', 'error');
    }
  });
}

async function renderFeed(){
  const list = document.getElementById('feed-list');
  if(!list) return;
  const user = Session.current();
  list.innerHTML = `<div class="card post"><div class="skeleton" style="height:16px;width:60%;margin-bottom:10px;"></div><div class="skeleton" style="height:12px;width:90%;margin-bottom:6px;"></div><div class="skeleton" style="height:12px;width:80%;"></div></div>`;

  try {
    const res = await fetch(`/api/thought/feed?tab=${currentFeedTab}`, { headers: authHeaders() });
    const thoughts = await res.json();

    if(!res.ok){
      list.innerHTML = `<div class="card empty-state"><h4>Couldn't load the feed</h4><p>${thoughts.message || 'Try again in a moment.'}</p></div>`;
      return;
    }

    if(!thoughts.length){
      list.innerHTML = `<div class="card empty-state"><div class="icon-circle"><i class="fa-solid fa-note-sticky"></i></div><h4>${currentFeedTab==='friends'?'Nothing from friends yet':'Say something worth sharing'}</h4><p>${currentFeedTab==='friends'?'When your friends post, you\'ll see it here.':'Be the first to share something today.'}</p></div>`;
      return;
    }
    list.innerHTML = thoughts.map(t=> postCardHTML(t, user)).join('');
  } catch (err) {
    list.innerHTML = `<div class="card empty-state"><h4>Couldn't reach the server</h4></div>`;
  }
}

function postCardHTML(t, currentUser){
  const visIcon = {GLOBAL:'fa-earth-americas', FRIENDS:'fa-user-group', ONLY_ME:'fa-lock'}[t.visibility] || 'fa-earth-americas';
  const visLabel = {GLOBAL:'Global', FRIENDS:'Friends', ONLY_ME:'Only me'}[t.visibility] || 'Global';

  const reactionsHTML = REACTIONS.map(r=>{
    const active = (t.myReactions||[]).includes(r.key);
    const count = t.reactions?.[r.key] || 0;
    return `<button class="reaction-pill ${active?'active':''}" data-reaction="${r.key}" data-thought="${t.thoughtId}">
      <i class="fa-solid ${r.icon}"></i> ${count>0?count:''}
    </button>`;
  }).join('');

  return `
  <article class="card post" data-thought-card="${t.thoughtId}">
    <div class="post-head">
      <img src="${t.authorAvatarUrl}" class="avatar avatar-40" alt="">
      <div class="who">
        <b>${escapeHTML(t.authorName)}</b>
        <div class="meta">@${escapeHTML(t.authorUserName)} · ${timeAgo(t.createdAt)} · <i class="fa-solid ${visIcon}" style="font-size:10px;"></i> ${visLabel}</div>
      </div>
      <div class="dropdown">
        <button class="icon-btn btn-sm" style="width:34px;height:34px;" data-dropdown-toggle="menu-${t.thoughtId}"><i class="fa-solid fa-ellipsis"></i></button>
        <div class="dropdown-menu" id="menu-${t.thoughtId}">
          ${t.mine ? `<button class="danger" data-delete-thought="${t.thoughtId}"><i class="fa-solid fa-trash"></i> Delete</button>` : `<button data-report-thought="${t.thoughtId}"><i class="fa-solid fa-flag"></i> Report</button>`}
        </div>
      </div>
    </div>
    <div class="post-content">${escapeHTML(t.content)}</div>
    <div class="post-actions">
      <div class="reaction-bar">${reactionsHTML}</div>
      <div class="spacer"></div>
      <button class="post-icon-btn" data-comment-thought="${t.thoughtId}"><i class="fa-solid fa-comment"></i> ${t.commentCount||0}</button>
      <button class="post-icon-btn" data-share-thought="${t.thoughtId}"><i class="fa-solid fa-share"></i> ${t.shares||0}</button>
    </div>
  </article>`;
}

document.addEventListener('click', async (e)=>{
  const reactBtn = e.target.closest('[data-reaction]');
  if(reactBtn){
    const key = reactBtn.dataset.reaction;
    const id = reactBtn.dataset.thought;
    reactBtn.disabled = true;
    try {
      const res = await fetch(`/api/thought/${id}/react/${key}`, { method: 'POST', headers: authHeaders() });
      const t = await res.json();
      if(res.ok){
        const active = (t.myReactions||[]).includes(key);
        const count = t.reactions?.[key] || 0;
        reactBtn.classList.toggle('active', active);
        reactBtn.innerHTML = `<i class="fa-solid ${REACTIONS.find(r=>r.key===key).icon}"></i> ${count>0?count:''}`;
      }
    } catch (err) { /* ignore, UI stays as-is */ }
    reactBtn.disabled = false;
  }

  const shareBtn = e.target.closest('[data-share-thought]');
  if(shareBtn){
    const id = shareBtn.dataset.shareThought;
    try {
      const res = await fetch(`/api/thought/${id}/share`, { method: 'POST', headers: authHeaders() });
      const t = await res.json();
      if(res.ok){
        shareBtn.innerHTML = `<i class="fa-solid fa-share"></i> ${t.shares}`;
        showToast('Shared to your circle.', 'success');
      }
    } catch (err) { showToast('Could not share right now.', 'error'); }
  }

  const deleteBtn = e.target.closest('[data-delete-thought]');
  if(deleteBtn){
    if(confirm('Delete this thought? This cannot be undone.')){
      const id = deleteBtn.dataset.deleteThought;
      try {
        const res = await fetch(`/api/thought/${id}`, { method: 'DELETE', headers: authHeaders() });
        if(res.ok || res.status === 204){
          showToast('Thought deleted.', 'success');
          if(typeof renderFeed === 'function') renderFeed();
          if(typeof renderMyThoughts === 'function') renderMyThoughts();
        }
      } catch (err) { showToast('Could not delete right now.', 'error'); }
    }
  }

  const commentBtn = e.target.closest('[data-comment-thought]');
  if(commentBtn){ showToast('Comments are coming soon in this preview.', 'default', 2000); }
  const reportBtn = e.target.closest('[data-report-thought]');
  if(reportBtn){ showToast('Thanks — this has been reported for review.', 'success'); }
});

function renderRightSidebar(user){
  renderProgressCard(user);
  renderLeaderboardCard(user);
  renderSuggestionsCard(user);
}

function renderProgressCard(user){
  const el = document.getElementById('progress-card-body');
  if(!el) return;
  const nextMilestone = Math.ceil((user.points+1)/500)*500;
  el.innerHTML = `
    <div class="mini-stat-row"><div class="ic" style="background:var(--color-primary-light);color:var(--color-primary-dark);"><i class="fa-solid fa-face-smile"></i></div><div class="txt"><b>${user.smiles}</b><span>Smiles verified</span></div></div>
    <div class="mini-stat-row"><div class="ic" style="background:var(--color-accent-light);color:var(--color-accent);"><i class="fa-solid fa-star"></i></div><div class="txt"><b>${user.points}</b><span>SMILO points</span></div></div>
    <div class="mini-stat-row"><div class="ic" style="background:var(--color-secondary);color:#7A4B08;"><i class="fa-solid fa-fire"></i></div><div class="txt"><b>${user.streak} days</b><span>Current streak</span></div></div>
    <div style="margin-top:10px;">
      <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-faint);margin-bottom:6px;"><span>Next milestone</span><span>${user.points}/${nextMilestone}</span></div>
      <div class="progress"><span style="width:${Math.min(100,(user.points/nextMilestone)*100)}%"></span></div>
    </div>
  `;
}

function renderLeaderboardCard(user){
  const el = document.getElementById('mini-leaderboard-body');
  if(!el) return;
  const all = [...Users.all()].sort((a,b)=>b.points-a.points).slice(0,5);
  el.innerHTML = all.map((u,i)=>`
    <div class="leader-row ${u.id===user.id?'me':''}">
      <span class="rank">${i+1}</span>
      <img src="${u.avatar}" class="avatar avatar-24" alt="">
      <span class="name">${u.id===user.id?'You':escapeHTML(u.name)}</span>
      <span class="pts">${u.points}</span>
    </div>`).join('');
}

async function renderSuggestionsCard(user){
  const el = document.getElementById('suggestions-card-body');
  if(!el) return;

  try {
    const res = await fetch('/api/friends/discover', { headers: authHeaders() });
    const people = res.ok ? await res.json() : [];
    const suggestions = people.slice(0,4);

    if(!suggestions.length){ el.innerHTML = `<p style="font-size:12.5px;color:var(--text-faint);">No suggestions right now.</p>`; return; }

    el.innerHTML = suggestions.map(u=>`
      <div class="suggest-row">
        <img src="${u.avatarUrl}" class="avatar avatar-32" alt="">
        <div class="txt"><b>${escapeHTML(u.name)}</b><span>${u.mutualFriends>0?`${u.mutualFriends} mutual friend${u.mutualFriends===1?'':'s'}`:'SMILO member'}</span></div>
        ${u.relationship==='PENDING_SENT'
          ? `<button class="btn btn-secondary btn-sm" disabled>Sent</button>`
          : `<button class="btn btn-outline btn-sm" data-add-friend="${u.userId}">Add</button>`}
      </div>`).join('');
  } catch (err) {
    el.innerHTML = `<p style="font-size:12.5px;color:var(--text-faint);">Could not load suggestions.</p>`;
  }
}

document.addEventListener('click', async (e)=>{
  const addBtn = e.target.closest('[data-add-friend]');
  if(addBtn && currentPageName()==='home.html'){
    addBtn.disabled = true;
    try {
      const res = await fetch(`/api/friends/request/${addBtn.dataset.addFriend}`, { method:'POST', headers: authHeaders() });
      if(res.ok){
        showToast('Friend request sent.', 'success');
        const user = Session.current();
        renderSuggestionsCard(user);
      } else {
        addBtn.disabled = false;
        const data = await res.json();
        showToast(data.message || 'Could not send request.', 'error');
      }
    } catch (err) { addBtn.disabled = false; showToast('Could not reach the server.', 'error'); }
  }
});

function renderCommunityGoalCard(){
  const el = document.getElementById('community-goal-card');
  if(!el) return;
  const g = CommunityGoal.get();
  const pct = Math.min(100, Math.round((g.current/g.target)*100));
  el.innerHTML = `
    <div class="goal-head"><h3 style="font-size:15px;font-weight:700;"><i class="fa-solid fa-people-group" style="color:var(--color-accent);margin-right:6px;"></i>SMILO COMMUNITY GOAL</h3>${g.completed?'<span class="badge badge-success">Complete</span>':''}</div>
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:2px;">${escapeHTML(g.title)}</div>
    <div class="goal-nums">${g.current.toLocaleString()} <span>/ ${g.target.toLocaleString()} smiles</span></div>
    <div class="progress"><span style="width:${pct}%"></span></div>
    <div class="goal-people"><i class="fa-solid fa-users"></i> ${g.participants.toLocaleString()} people participating</div>
    ${g.completed ? `<div class="privacy-note" style="margin-top:12px;background:var(--color-success-light);"><i class="fa-solid fa-trophy" style="color:var(--color-success);"></i><div>Community milestone unlocked! Every participant earned the <b style="color:var(--text);">Autumn Wave</b> badge.</div></div>` : ''}
  `;
}

document.addEventListener('DOMContentLoaded', initHomePage);