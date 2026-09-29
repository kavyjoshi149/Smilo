/* ============================================================
   SMILO — settings.js
   ============================================================ */
function initSettingsPage(){
  if(currentPageName() !== 'settings.html') return;
  const user = Session.current();
  if(!user) return;

  const form = document.getElementById('profile-form');
  if(form){
    form.name.value = user.name;
    form.username.value = user.username;
    form.bio.value = user.bio || '';
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      user.name = form.name.value.trim() || user.name;
      user.bio = form.bio.value.trim();
      Users.save(user);
      showToast('Profile updated.', 'success');
      renderNavbarStats();
    });
  }

  const prefs = Prefs.get();
  const positiveToggle = document.getElementById('positive-mode-toggle');
  if(positiveToggle){
    positiveToggle.checked = prefs.feedMode === 'positive';
    positiveToggle.addEventListener('change', ()=>{
      prefs.feedMode = positiveToggle.checked ? 'positive' : 'normal';
      Prefs.save(prefs);
      showToast(`Switched to ${prefs.feedMode==='positive'?'Positive':'Normal'} Mode.`, 'success');
    });
  }

  document.querySelectorAll('[data-privacy-select]').forEach(sel=>{
    sel.addEventListener('change', ()=> showToast('Privacy preference saved.', 'success', 1800));
  });

  document.getElementById('logout-settings-btn')?.addEventListener('click', doLogout);

  document.getElementById('settings-nav')?.addEventListener('click', (e)=>{
    const link = e.target.closest('a[data-settings-tab]');
    if(!link) return;
    e.preventDefault();
    document.querySelectorAll('#settings-nav a').forEach(a=>a.classList.remove('active'));
    link.classList.add('active');
    document.querySelectorAll('[data-settings-panel]').forEach(p=>p.classList.add('hidden'));
    document.querySelector(`[data-settings-panel="${link.dataset.settingsTab}"]`)?.classList.remove('hidden');
  });
}

document.addEventListener('DOMContentLoaded', initSettingsPage);
