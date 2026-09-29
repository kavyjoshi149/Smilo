/* ============================================================
   SMILO — ui.js
   Toasts, modals, dropdown menus, mobile drawer, small helpers.
   ============================================================ */

function ensureToastRegion(){
  let region = document.getElementById('toast-region');
  if(!region){
    region = document.createElement('div');
    region.id = 'toast-region';
    document.body.appendChild(region);
  }
  return region;
}

function showToast(message, type='default', ms=3200){
  const region = ensureToastRegion();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type==='success' ? 'fa-circle-check' : type==='error' ? 'fa-circle-exclamation' : 'fa-face-smile';
  el.innerHTML = `<i class="fa-solid ${icon}"></i><span></span>`;
  el.querySelector('span').textContent = message;
  region.appendChild(el);
  setTimeout(()=>{
    el.style.opacity='0'; el.style.transform='translateY(6px)';
    setTimeout(()=>el.remove(), 220);
  }, ms);
}

function openModal(id){
  const overlay = document.getElementById(id);
  if(!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(id){
  const overlay = document.getElementById(id);
  if(!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow='';
}

function setButtonLoading(btn, loading){
  if(!btn) return;
  if(loading){
    btn.classList.add('is-loading');
    btn.disabled = true;
    if(!btn.querySelector('.spinner')){
      const s = document.createElement('span');
      s.className='spinner';
      btn.appendChild(s);
    }
  } else {
    btn.classList.remove('is-loading');
    btn.disabled = false;
  }
}

function initGlobalUI(){
  // modal overlay click-outside + close buttons
  document.addEventListener('click', (e)=>{
    const overlay = e.target.closest('.modal-overlay');
    if(overlay && e.target === overlay){ overlay.classList.remove('open'); document.body.style.overflow=''; }
    const closeBtn = e.target.closest('[data-modal-close]');
    if(closeBtn){ closeModal(closeBtn.closest('.modal-overlay').id); }
    const openBtn = e.target.closest('[data-modal-open]');
    if(openBtn){ openModal(openBtn.dataset.modalOpen); }

    // dropdown toggles
    const ddToggle = e.target.closest('[data-dropdown-toggle]');
    if(ddToggle){
      const menu = document.getElementById(ddToggle.dataset.dropdownToggle);
      const willOpen = !menu.classList.contains('open');
      document.querySelectorAll('.dropdown-menu.open').forEach(m=>m.classList.remove('open'));
      if(willOpen) menu.classList.add('open');
      e.stopPropagation();
    } else if(!e.target.closest('.dropdown-menu')){
      document.querySelectorAll('.dropdown-menu.open').forEach(m=>m.classList.remove('open'));
    }

    // drawer
    const drawerOpenBtn = e.target.closest('[data-drawer-open]');
    if(drawerOpenBtn){
      document.getElementById(drawerOpenBtn.dataset.drawerOpen)?.classList.add('open');
      document.getElementById('drawer-overlay')?.classList.add('open');
    }
    const drawerCloseBtn = e.target.closest('[data-drawer-close]');
    if(drawerCloseBtn || e.target.id==='drawer-overlay'){
      document.querySelectorAll('.drawer.open').forEach(d=>d.classList.remove('open'));
      document.getElementById('drawer-overlay')?.classList.remove('open');
    }

    // tabs
    const tabBtn = e.target.closest('[data-tab]');
    if(tabBtn){
      const group = tabBtn.closest('[data-tab-group]');
      if(group){
        group.querySelectorAll('[data-tab]').forEach(t=>t.classList.remove('active'));
        tabBtn.classList.add('active');
        const panelGroup = document.querySelector(`[data-tab-panels="${group.dataset.tabGroup}"]`);
        if(panelGroup){
          panelGroup.querySelectorAll('[data-tab-panel]').forEach(p=>{
            p.classList.toggle('hidden', p.dataset.tabPanel !== tabBtn.dataset.tab);
          });
        }
        group.dispatchEvent(new CustomEvent('tabchange', {detail:{tab:tabBtn.dataset.tab}}));
      }
    }
  });

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      document.querySelectorAll('.modal-overlay.open').forEach(m=>{m.classList.remove('open');});
      document.body.style.overflow='';
      document.querySelectorAll('.dropdown-menu.open').forEach(m=>m.classList.remove('open'));
    }
  });
}

function animateCount(el, target, duration=900){
  if(!el) return;
  const start = 0;
  const startTime = performance.now();
  function tick(now){
    const p = Math.min(1, (now-startTime)/duration);
    const eased = 1 - Math.pow(1-p, 3);
    const val = Math.floor(start + (target-start)*eased);
    el.textContent = val.toLocaleString();
    if(p<1) requestAnimationFrame(tick);
    else el.textContent = target.toLocaleString();
  }
  requestAnimationFrame(tick);
}

document.addEventListener('DOMContentLoaded', initGlobalUI);
