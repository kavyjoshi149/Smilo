/* ============================================================
   SMILO — leaderboard.js
   ============================================================ */
let lbTab = 'global';

function initLeaderboardPage(){
  if(currentPageName() !== 'leaderboard.html') return;
  renderLeaderboard();
  document.querySelector('[data-tab-group="leaderboard"]')?.addEventListener('tabchange', (e)=>{
    lbTab = e.detail.tab;
    renderLeaderboard();
  });
}

function renderLeaderboard(){
  const el = document.getElementById('leaderboard-body');
  const banner = document.getElementById('leaderboard-you');
  if(!el) return;
  const user = Session.current();

  let pool = Users.all();
  if(lbTab === 'friends'){
    const ids = new Set([user.id, ...Friends.friendIdsOf(user.id)]);
    pool = pool.filter(u=>ids.has(u.id));
  }
  pool = [...pool].sort((a,b)=>b.points-a.points);

  const myRank = pool.findIndex(u=>u.id===user.id) + 1;
  const above = pool[Math.max(0, pool.findIndex(u=>u.id===user.id)-1)];
  if(banner){
    if(above && above.id !== user.id){
      const gap = above.points - user.points;
      banner.innerHTML = `<span>You're ranked <b>#${myRank}</b> ${gap>0?`— <b>${gap} points</b> away from #${myRank-1}`:''}</span><span class="badge badge-primary">${user.points} pts</span>`;
    } else {
      banner.innerHTML = `<span>You're currently <b>#${myRank}</b> — leading the pack.</span><span class="badge badge-primary">${user.points} pts</span>`;
    }
  }

  el.innerHTML = pool.map((u,i)=>{
    const rank = i+1;
    const medal = rank===1?'fa-trophy':rank===2?'fa-medal':rank===3?'fa-award':null;
    return `
    <div class="lead-full-row ${u.id===user.id?'me':''}">
      <span class="rank ${rank<=3?'top3':''}">${medal?`<i class="fa-solid ${medal}"></i>`:rank}</span>
      <img src="${u.avatar}" class="avatar avatar-40" alt="">
      <div class="who"><b>${u.id===user.id?'You':escapeHTML(u.name)}</b><span>${u.streak}-day streak</span></div>
      <div class="pts">${u.points.toLocaleString()} pts</div>
    </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', initLeaderboardPage);
