/* ============================================================
   SMILO — thoughts.js
   "My Thoughts" page now calls /api/thought/mine instead of
   reading from localStorage.
   ============================================================ */
let thoughtsTab = 'all';

function authHeaders(){
  const token = localStorage.getItem('smilo_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function initThoughtsPage(){
  if(currentPageName() !== 'thoughts.html') return;
  renderMyThoughts();
  document.querySelector('[data-tab-group="thoughts"]')?.addEventListener('tabchange', (e)=>{
    thoughtsTab = e.detail.tab;
    renderMyThoughts();
  });
}

async function renderMyThoughts(){
  const el = document.getElementById('thoughts-body');
  if(!el) return;

  // frontend tab "private" maps to backend visibility ONLY_ME
  const visibilityParam = thoughtsTab === 'private' ? 'only_me' : thoughtsTab;

  try {
    const res = await fetch(`/api/thought/mine?visibility=${visibilityParam}`, { headers: authHeaders() });
    const list = await res.json();

    if(!res.ok){
      el.innerHTML = `<div class="card empty-state"><h4>Couldn't load your thoughts</h4><p>${list.message || 'Try again in a moment.'}</p></div>`;
      return;
    }

    if(!list.length){
      el.innerHTML = `<div class="card empty-state"><div class="icon-circle"><i class="fa-solid fa-note-sticky"></i></div><h4>Say something worth sharing</h4><p>Thoughts you post will show up here so you can track how they land.</p></div>`;
      return;
    }

    el.innerHTML = list.map(t=>{
      const engagement = Object.values(t.reactions||{}).reduce((a,b)=>a+b,0);
      const visLabel = {GLOBAL:'Global', FRIENDS:'Friends', ONLY_ME:'Only me'}[t.visibility] || 'Global';
      return `
      <div class="card post">
        <div class="post-head">
          <div class="who" style="flex:1;">
            <div class="meta"><i class="fa-solid fa-clock"></i> ${timeAgo(t.createdAt)} · <span class="badge badge-muted">${visLabel}</span></div>
          </div>
          <div class="thought-row-actions">
            <button class="icon-btn btn-sm" style="width:32px;height:32px;" data-delete-thought="${t.thoughtId}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <div class="post-content">${escapeHTML(t.content)}</div>
        <div class="post-actions">
          <span class="post-icon-btn"><i class="fa-solid fa-face-smile"></i> ${engagement} reactions</span>
          <span class="post-icon-btn"><i class="fa-solid fa-comment"></i> ${t.commentCount||0}</span>
          <span class="post-icon-btn"><i class="fa-solid fa-share"></i> ${t.shares||0}</span>
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    el.innerHTML = `<div class="card empty-state"><h4>Couldn't reach the server</h4></div>`;
  }
}

document.addEventListener('DOMContentLoaded', initThoughtsPage);