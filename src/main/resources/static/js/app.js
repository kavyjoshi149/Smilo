/* ============================================================
   SMILO — app.js
   Renders the shared navbar / left sidebar / mobile drawer on
   every authenticated page, and wires cross-page bits (global
   pulse numbers, notifications, logout).
   ============================================================ */

const NAV_ITEMS = [
  {page:'home.html', icon:'fa-house', label:'Home'},
  {page:'friends.html', icon:'fa-user-group', label:'Friends'},
  {page:'discover.html', icon:'fa-compass', label:'Discover People'},
  {page:'chat.html', icon:'fa-message', label:'Chat'},
  {page:'leaderboard.html', icon:'fa-ranking-star', label:'Leaderboard'},
  {page:'thoughts.html', icon:'fa-note-sticky', label:'My Thoughts'},
  {page:'settings.html', icon:'fa-gear', label:'Settings'}
];

function renderNavbar(){
  const root = document.getElementById('navbar-root');
  if(!root) return;
  const user = Session.current();
  const stats = GlobalStats.get();
  const pending = user ? Friends.pendingToMe(user.id).length : 0;

  root.innerHTML = `
  <header class="navbar">
    <div class="navbar-inner">
      <div style="display:flex;align-items:center;gap:14px;">
        <button class="icon-btn mobile-menu-btn" data-drawer-open="mobile-drawer" aria-label="Open menu"><i class="fa-solid fa-bars"></i></button>
        <a href="home.html" class="brand"><span class="brand-mark"><i class="fa-solid fa-face-smile"></i></span><span>SMILO</span></a>
      </div>
      <div class="nav-pulse">
        <div class="pulse-stat pulse-global"><span class="dot-icon"><i class="fa-solid fa-face-smile"></i></span><b class="count-up" id="nav-global-count">${stats.totalSmiles.toLocaleString()}</b><span class="label-full">smiles</span></div>
        ${user ? `<div class="pulse-stat pulse-streak"><span class="dot-icon"><i class="fa-solid fa-fire"></i></span><b>${user.streak}</b><span class="label-full">day streak</span></div>` : ''}
      </div>
      <div class="nav-right">
        <button class="icon-btn" data-theme-toggle aria-label="Toggle theme"><i class="fa-solid fa-moon"></i></button>
        <div class="dropdown">
          <button class="icon-btn" data-dropdown-toggle="notif-menu" aria-label="Notifications">
            <i class="fa-solid fa-bell"></i>${pending>0?'<span class="ping"></span>':''}
          </button>
          <div class="dropdown-menu" id="notif-menu" style="width:280px;">
            ${renderNotifDropdown(user, pending)}
          </div>
        </div>
        <div class="dropdown">
          <button class="nav-user" data-dropdown-toggle="profile-menu">
            <img src="${user?.avatar}" class="avatar avatar-32" alt="">
            <span>${user ? user.name.split(' ')[0] : ''}</span>
            <i class="fa-solid fa-chevron-down" style="font-size:10px;color:var(--text-faint);"></i>
          </button>
          <div class="dropdown-menu" id="profile-menu">
            <a href="dashboard.html"><i class="fa-solid fa-chart-simple"></i> Dashboard</a>
            <a href="dashboard.html#profile"><i class="fa-solid fa-user"></i> Profile</a>
            <a href="settings.html"><i class="fa-solid fa-gear"></i> Settings</a>
            <hr>
            <button class="danger" id="logout-btn"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
          </div>
        </div>
      </div>
    </div>
  </header>`;

  document.getElementById('logout-btn')?.addEventListener('click', doLogout);
  animateCount(document.getElementById('nav-global-count'), stats.totalSmiles, 1000);

  renderMobileDrawer(user);
}

function renderNotifDropdown(user, pendingCount){
  if(!user) return '';
  const items = [];
  if(pendingCount>0) items.push(`<a href="discover.html#requests"><i class="fa-solid fa-user-plus" style="color:var(--color-primary);"></i> ${pendingCount} new friend request${pendingCount>1?'s':''}</a>`);
  const goal = CommunityGoal.get();
  if(!goal.completed){
    items.push(`<a href="home.html#community"><i class="fa-solid fa-people-group" style="color:var(--color-accent);"></i> Community goal is ${Math.round(goal.current/goal.target*100)}% funded</a>`);
  }
  const missionsLeft = Missions.all().filter(m=>!m.completed && m.type==='daily').length;
  if(missionsLeft>0) items.push(`<a href="dashboard.html#missions"><i class="fa-solid fa-seedling" style="color:var(--color-success);"></i> ${missionsLeft} mission${missionsLeft>1?'s':''} left today</a>`);
  if(!items.length) items.push(`<div style="padding:14px;text-align:center;color:var(--text-faint);font-size:12.5px;">You're all caught up.</div>`);
  return items.join('');
}

function renderMobileDrawer(user){
  let overlay = document.getElementById('drawer-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.className='drawer-overlay';
    overlay.id='drawer-overlay';
    document.body.appendChild(overlay);
  }
  let drawer = document.getElementById('mobile-drawer');
  if(!drawer){
    drawer = document.createElement('div');
    drawer.className='drawer';
    drawer.id='mobile-drawer';
    document.body.appendChild(drawer);
  }
  const active = currentPageName();
  drawer.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <a href="home.html" class="brand" style="font-size:18px;"><span class="brand-mark" style="width:30px;height:30px;font-size:14px;"><i class="fa-solid fa-face-smile"></i></span>SMILO</a>
      <button class="icon-btn" data-drawer-close><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="side-nav" style="border:none;padding:0;">
      ${NAV_ITEMS.map(item=>`<a href="${item.page}" class="${active===item.page?'active':''}"><i class="fa-solid ${item.icon}"></i>${item.label}</a>`).join('')}
    </div>
  `;
}

function renderSideNav(){
  const root = document.getElementById('side-nav-root');
  if(!root) return;
  const active = currentPageName();
  root.innerHTML = `
    <nav class="side-nav">
      ${NAV_ITEMS.map(item=>`<a href="${item.page}" class="${active===item.page?'active':''}"><i class="fa-solid ${item.icon}"></i>${item.label}</a>`).join('')}
    </nav>
    <div class="assist-card">
      <h4>SMILO Assist</h4>
      <p>Need a little help putting something into words?</p>
      <a href="chat.html?assist=1" class="btn btn-primary btn-sm btn-block"><i class="fa-solid fa-comment-dots"></i> Need a little help?</a>
    </div>
    <div class="privacy-note">
      <i class="fa-solid fa-lock"></i>
      <div><b style="color:var(--text);">Your smile stays private.</b><br>Your photo never becomes part of your public feed.</div>
    </div>
  `;
}

function initApp(){
  renderNavbar();
  renderSideNav();
}

/* Convenience alias used by several page scripts after a state change
   (points/streak updates) to refresh the shared navbar + sidebar. */
function renderNavbarStats(){
  renderNavbar();
  renderSideNav();
}

document.addEventListener('DOMContentLoaded', initApp);

/* Add-friend is rendered on several pages (Home sidebar, Discover, Friends
   suggestions) so the handler lives here, once, always loaded. */
document.addEventListener('click', (e)=>{
  const addBtn = e.target.closest('[data-add-friend]');
  if(addBtn){
    const user = Session.current();
    if(!user) return;
    Friends.sendRequest(user.id, addBtn.dataset.addFriend);
    addBtn.textContent = 'Sent';
    addBtn.disabled = true;
    addBtn.classList.remove('btn-outline');
    addBtn.classList.add('btn-secondary');
    showToast('Friend request sent.', 'success');
    if(typeof renderNavbar === 'function') renderNavbar();
  }
});
