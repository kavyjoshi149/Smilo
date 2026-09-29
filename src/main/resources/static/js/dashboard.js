/* ============================================================
   SMILO — dashboard.js
   ============================================================ */
function initDashboardPage(){
  if(currentPageName() !== 'dashboard.html') return;
  const user = Session.current();
  if(!user) return;

  renderDashboardProfile(user);
  renderStatGrid(user);
  renderImpact(user);
  renderMissionsList();
  renderAchievements(user);
}

function renderDashboardProfile(user){
  const el = document.getElementById('dash-profile');
  if(!el) return;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
      <img src="${user.avatar}" class="avatar avatar-96 avatar-ring" alt="">
      <div style="flex:1;min-width:200px;">
        <h2 style="font-size:21px;">${escapeHTML(user.name)}</h2>
        <div style="color:var(--text-muted);font-size:13.5px;">@${escapeHTML(user.username)}</div>
        <p style="margin-top:8px;font-size:13.5px;color:var(--text-muted);max-width:440px;">${escapeHTML(user.bio)}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
          ${(user.interests||[]).map(i=>`<span class="chip" style="cursor:default;">${escapeHTML(i)}</span>`).join('') || '<span style="font-size:12px;color:var(--text-faint);">No interests added yet</span>'}
        </div>
      </div>
      <a href="settings.html" class="btn btn-outline btn-sm"><i class="fa-solid fa-pen"></i> Edit profile</a>
    </div>
  `;
}

function renderStatGrid(user){
  const el = document.getElementById('stat-grid');
  if(!el) return;
  const friendCount = Friends.friendIdsOf(user.id).length;
  const items = [
    {icon:'fa-face-smile', color:'var(--color-primary-light)', tc:'var(--color-primary-dark)', val:user.smiles, label:'Smiles verified'},
    {icon:'fa-star', color:'var(--color-accent-light)', tc:'var(--color-accent)', val:user.points, label:'SMILO points'},
    {icon:'fa-fire', color:'var(--color-secondary)', tc:'#7A4B08', val:user.streak, label:'Day streak'},
    {icon:'fa-user-group', color:'var(--color-success-light)', tc:'var(--color-success)', val:friendCount, label:'Friends'}
  ];
  el.innerHTML = items.map(i=>`
    <div class="card stat-card">
      <div class="ic" style="background:${i.color};color:${i.tc};"><i class="fa-solid ${i.icon}"></i></div>
      <b>${i.val}</b><span>${i.label}</span>
    </div>`).join('');
}

function renderImpact(user){
  const el = document.getElementById('impact-body');
  if(!el) return;
  const myThoughts = Thoughts.byUser(user.id);
  const thoughtImpact = myThoughts.reduce((sum,t)=> sum + Object.values(t.reactions||{}).reduce((a,b)=>a+b,0), 0);
  const communityContribution = Math.round(user.smiles * 0.6 + myThoughts.length * 3);
  const missionsDone = Missions.all().filter(m=>m.completed).length;
  const total = user.smiles*2 + thoughtImpact + communityContribution + missionsDone*15;

  document.getElementById('impact-total').textContent = total.toLocaleString();
  el.innerHTML = `
    <div class="impact-item"><i class="fa-solid fa-face-smile" style="color:var(--color-primary);"></i><b>${user.smiles*2}</b><span>Smile Contribution</span></div>
    <div class="impact-item"><i class="fa-solid fa-lightbulb" style="color:var(--color-secondary);"></i><b>${thoughtImpact}</b><span>Thought Impact</span></div>
    <div class="impact-item"><i class="fa-solid fa-handshake" style="color:var(--color-accent);"></i><b>${communityContribution}</b><span>Community Contribution</span></div>
    <div class="impact-item"><i class="fa-solid fa-seedling" style="color:var(--color-success);"></i><b>${missionsDone*15}</b><span>Mission Progress</span></div>
  `;
}

function renderMissionsList(){
  const el = document.getElementById('missions-body');
  if(!el) return;
  const missions = Missions.all();
  const daily = missions.filter(m=>m.type==='daily');
  const weekly = missions.filter(m=>m.type==='weekly');

  function rowsFor(arr){
    return arr.map(m=>`
      <div class="mission-row ${m.completed?'done':''}">
        <button class="mission-check ${m.completed?'done':''}" data-complete-mission="${m.id}" ${m.completed?'disabled':''}>
          <i class="fa-solid fa-check"></i>
        </button>
        <div class="txt"><b>${escapeHTML(m.title)}</b><span>${escapeHTML(m.description)}</span></div>
        <span class="badge badge-primary">+${m.reward} pts</span>
      </div>`).join('');
  }

  el.innerHTML = `
    <h4 style="font-size:12.5px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.03em;margin-bottom:6px;">Today's Missions</h4>
    ${rowsFor(daily)}
    <h4 style="font-size:12.5px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.03em;margin:16px 0 6px;">Weekly Missions</h4>
    ${rowsFor(weekly)}
  `;
}

document.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-complete-mission]');
  if(btn){
    const mission = Missions.complete(btn.dataset.completeMission);
    if(!mission) return;
    const user = Session.current();
    user.points += mission.reward;
    updateStreakForActivity(user);
    const unlocked = checkAchievements(user);
    Users.save(user);
    showToast(`Mission complete: +${mission.reward} points`, 'success');
    renderMissionsList();
    renderStatGrid(user);
    renderImpact(user);
    if(typeof renderNavbarStats==='function') renderNavbarStats();
    if(unlocked.length) setTimeout(()=>showToast(`Achievement unlocked: ${unlocked[0].title}`,'success'), 600);
  }
});

function renderAchievements(user){
  const el = document.getElementById('achieve-grid');
  if(!el) return;
  el.innerHTML = ACHIEVEMENT_DEFS.map(a=>{
    const unlocked = user.achievements.includes(a.id);
    return `<div class="card achieve-card ${unlocked?'':'locked'}">
      <div class="ic"><i class="fa-solid ${a.icon}"></i></div>
      <h4>${a.title}</h4><p>${a.desc}</p>
    </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', initDashboardPage);
