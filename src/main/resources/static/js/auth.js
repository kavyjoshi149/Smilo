/* ============================================================
   SMILO — auth.js
   Wired to the real backend at /api/auth (same-origin, since
   Spring Boot now serves these Thymeleaf pages itself).
   Passwords are hashed server-side; this file no longer stores
   or checks passwords locally.
   ============================================================ */

const API_BASE = '/api/auth'; // same-origin — Spring Boot serves both pages and API

const PROTECTED_PAGES = ['home.html','dashboard.html','friends.html','discover.html','leaderboard.html','thoughts.html','chat.html','settings.html'];

function currentPageName(){
  return location.pathname.split('/').pop() || 'index.html';
}

function guardRoute(){
  const page = currentPageName();
  if(PROTECTED_PAGES.includes(page) && !Session.isAuthed()){
    location.href = 'login.html';
  }
}
guardRoute();

function doLogout(){
  localStorage.removeItem('smilo_jwt');
  Session.clear();
  location.href = 'login.html';
}

/* ----------------------------------------------------------
   Bridges a real backend AuthResponse ({token, user}) into
   the existing localStorage-based Users/Session model, so
   pages not yet wired to the backend keep working. The JWT
   is stored separately for use by future authenticated calls.
   ---------------------------------------------------------- */
function applySessionFromAuthResponse(data){
  const backendUser = data.user;

  localStorage.setItem('smilo_jwt', data.token);

  const bridgedUser = {
    id: backendUser.userId,
    name: backendUser.name,
    username: backendUser.userName,
    email: backendUser.email,
    avatar: backendUser.avatarUrl,
    bio: backendUser.bio,
    points: backendUser.smilePoint,
    smiles: 0,
    streak: backendUser.streak,
    longestStreak: backendUser.streak,
    interests: [],
    friends: [],
    achievements: [],
    createdAt: new Date().toISOString(),
    lastActivityDate: null,
    positiveMode: false
  };

  Users.save(bridgedUser);
  Session.set(bridgedUser.id);
  return bridgedUser;
}

/* ---------------- Login page ---------------- */
function initLoginPage(){
  const form = document.getElementById('login-form');
  if(!form) return;

  document.querySelectorAll('.toggle-visibility').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const input = btn.previousElementSibling;
      const isPwd = input.type === 'password';
      input.type = isPwd ? 'text' : 'password';
      btn.querySelector('i').className = isPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  });

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    clearFieldErrors(form);
    const identifier = form.email.value.trim(); // username or email — backend resolves either
    const password = form.password.value;
    let ok = true;
    if(!identifier){ setFieldError(form.email, 'Email is required'); ok=false; }
    if(!password){ setFieldError(form.password, 'Password is required'); ok=false; }
    if(!ok) return;

    const btn = form.querySelector('button[type="submit"]');
    setButtonLoading(btn, true);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: identifier, password })
      });
      const data = await res.json();

      if(!res.ok){
        setButtonLoading(btn, false);
        setFieldError(form.password, data.message || 'Incorrect email or password');
        showToast(data.message || 'Login failed. Check your details and try again.', 'error');
        return;
      }

      const user = applySessionFromAuthResponse(data);
      setButtonLoading(btn, false);
      showToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      setTimeout(()=> location.href = 'home.html', 500);
    } catch (err) {
      setButtonLoading(btn, false);
      showToast('Could not reach the server. Is the backend running?', 'error');
    }
  });

  // NOTE: demo login still points at local seed data — there's no
  // real "demo account" on the backend yet. Harmless to leave, or
  // hide this button until one exists.
  document.getElementById('demo-login-btn')?.addEventListener('click', ()=>{
    const demo = Users.byUsername('alexmorgan');
    if(demo){
      Session.set(demo.id);
      showToast('Signed in with the demo account', 'success');
      setTimeout(()=> location.href = 'home.html', 450);
    }
  });
}

/* ---------------- Signup page ---------------- */
function initSignupPage(){
  const form = document.getElementById('signup-form');
  if(!form) return;

  document.querySelectorAll('.toggle-visibility').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const input = btn.previousElementSibling;
      const isPwd = input.type === 'password';
      input.type = isPwd ? 'text' : 'password';
      btn.querySelector('i').className = isPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  });

  // Local availability hint only — a nicety for instant feedback.
  // The backend is the real source of truth and re-checks on submit.
  const usernameInput = form.username;
  const usernameHint = document.getElementById('username-hint');
  usernameInput?.addEventListener('input', ()=>{
    const val = usernameInput.value.trim().toLowerCase();
    if(!val){ usernameHint.textContent=''; return; }
    const taken = !!Users.byUsername(val);
    usernameHint.textContent = taken ? 'Username may be taken' : 'Looks available';
    usernameHint.style.color = taken ? 'var(--danger)' : 'var(--color-success)';
  });

  const pwdInput = form.password;
  const strengthFill = document.getElementById('strength-fill');
  pwdInput?.addEventListener('input', ()=>{
    const val = pwdInput.value;
    let score = 0;
    if(val.length >= 6) score++;
    if(val.length >= 10) score++;
    if(/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if(/[^A-Za-z0-9]/.test(val)) score++;
    const pct = [0,25,55,80,100][score];
    const colors = ['var(--border)','var(--danger)','var(--color-secondary)','var(--color-accent)','var(--color-success)'];
    strengthFill.style.width = pct+'%';
    strengthFill.style.background = colors[score];
  });

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    clearFieldErrors(form);
    const name = form.name.value.trim();
    const username = form.username.value.trim().toLowerCase();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;
    let ok = true;

    if(!name){ setFieldError(form.name,'Full name is required'); ok=false; }
    if(!username || username.length<3){ setFieldError(form.username,'Pick a username (3+ characters)'); ok=false; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ setFieldError(form.email,'Enter a valid email'); ok=false; }
    if(password.length < 6){ setFieldError(form.password,'Use at least 6 characters'); ok=false; }
    if(confirm !== password){ setFieldError(form.confirm,'Passwords do not match'); ok=false; }
    if(!form.terms.checked){ showToast('Please accept the Terms and Privacy agreement', 'error'); ok=false; }
    if(!ok) return;

    const btn = form.querySelector('button[type="submit"]');
    setButtonLoading(btn, true);

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: username, name, email, password })
      });
      const data = await res.json();

      if(!res.ok){
        setButtonLoading(btn, false);
        // Backend returns field-level errors for @Valid failures,
        // or a single "message" for things like duplicate username/email.
        if(data.userName) setFieldError(form.username, data.userName);
        if(data.email) setFieldError(form.email, data.email);
        if(data.password) setFieldError(form.password, data.password);
        if(data.message){
          if(/username/i.test(data.message)) setFieldError(form.username, data.message);
          else if(/email/i.test(data.message)) setFieldError(form.email, data.message);
        }
        showToast(data.message || 'Signup failed. Check the highlighted fields.', 'error');
        return;
      }

      applySessionFromAuthResponse(data);
      setButtonLoading(btn, false);
      showToast('Account created!', 'success');
      setTimeout(()=> location.href = 'onboarding.html', 500);
    } catch (err) {
      setButtonLoading(btn, false);
      showToast('Could not reach the server. Is the backend running?', 'error');
    }
  });
}

function setFieldError(input, message){
  const field = input.closest('.field');
  if(!field) return;
  field.classList.add('error');
  const err = field.querySelector('.field-error');
  if(err) err.textContent = message;
}
function clearFieldErrors(form){
  form.querySelectorAll('.field.error').forEach(f=>f.classList.remove('error'));
}

document.addEventListener('DOMContentLoaded', ()=>{
  initLoginPage();
  initSignupPage();
});