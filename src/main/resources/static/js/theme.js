/* ============================================================
   SMILO — theme.js  (reusable theme manager, light/black)
   ============================================================ */
const ThemeManager = {
  KEY: 'smilo_theme',
  get(){ return localStorage.getItem(this.KEY) || 'light'; },
  apply(theme){
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    localStorage.setItem(this.KEY, theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(btn=>{
      const icon = btn.querySelector('i');
      if(icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });
    document.querySelectorAll('[data-theme-pick]').forEach(el=>{
      el.classList.toggle('selected', el.dataset.themePick === theme);
    });
  },
  toggle(){
    const next = this.get() === 'dark' ? 'light' : 'dark';
    this.apply(next);
  },
  init(){
    this.apply(this.get());
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('[data-theme-toggle]');
      if(btn){ this.toggle(); }
      const pick = e.target.closest('[data-theme-pick]');
      if(pick){ this.apply(pick.dataset.themePick); }
    });
  }
};
ThemeManager.init();
