/* ============================================================
   SMILO — smile.js
   Real smile verification via POST /api/user/smile-photo.
   The photo is sent once, analyzed server-side with OpenCV, and
   never stored — the backend holds it in memory only for the
   duration of the request.
   ============================================================ */

function authHeaders(){
  const token = localStorage.getItem('smilo_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function openSmileModal(){
  resetSmileModal();
  openModal('smile-modal');
}

function resetSmileModal(){
  document.getElementById('smile-stage-choose')?.classList.remove('hidden');
  document.getElementById('smile-stage-analyzing')?.classList.add('hidden');
  document.getElementById('smile-stage-success')?.classList.add('hidden');
  document.getElementById('smile-stage-failed')?.classList.add('hidden');
  const input = document.getElementById('smile-file-input');
  if(input){ input.value = ''; input.removeAttribute('capture'); }
}

function initSmileFlow(){
  const modal = document.getElementById('smile-modal');
  if(!modal) return;

  const fileInput = document.getElementById('smile-file-input');

  // "Upload Image" — plain file picker
  document.getElementById('smile-choose-file-btn')?.addEventListener('click', ()=>{
    fileInput.removeAttribute('capture');
    fileInput.click();
  });

  // "Take Photo" — same file input, but hints mobile browsers to open the camera directly
  document.getElementById('smile-simulate-btn')?.addEventListener('click', ()=>{
    fileInput.setAttribute('capture', 'user');
    fileInput.click();
  });

  fileInput?.addEventListener('change', (e)=>{
    if(e.target.files && e.target.files[0]){
      runSmileVerification(e.target.files[0]);
    }
  });

  document.getElementById('smile-try-again-btn')?.addEventListener('click', resetSmileModal);
}

async function runSmileVerification(file){
  document.getElementById('smile-stage-choose').classList.add('hidden');
  const analyzing = document.getElementById('smile-stage-analyzing');
  analyzing.classList.remove('hidden');

  const user = Session.current();
  const pointsBefore = user ? user.points : 0;

  try {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch('/api/user/smile-photo', {
      method: 'POST',
      headers: authHeaders(), // no Content-Type — the browser sets the multipart boundary itself
      body: formData
    });

    const data = await res.json();
    analyzing.classList.add('hidden');

    if(!res.ok){
      document.getElementById('smile-stage-failed').classList.remove('hidden');
      showToast(data.message || 'Could not verify that photo.', 'error');
      return;
    }

    const pointsGained = Math.max(0, data.smilePoint - pointsBefore);

    if(pointsGained <= 0){
      // Request succeeded, but no smiling face was detected in the photo
      document.getElementById('smile-stage-failed').classList.remove('hidden');
      return;
    }

    completeSmileVerification(data, pointsGained);
  } catch (err) {
    analyzing.classList.add('hidden');
    document.getElementById('smile-stage-failed').classList.remove('hidden');
    showToast('Could not reach the server.', 'error');
  }
}

function completeSmileVerification(serverUser, pointsGained){
  const user = Session.current();
  if(!user) return;

  // Sync the bridged local session with the real backend totals
  user.points = serverUser.smilePoint;
  user.smiles = (user.smiles || 0) + 1;
  user.streak = serverUser.streak;
  user.longestStreak = Math.max(user.longestStreak || 0, user.streak);
  user.lastActivityDate = new Date().toISOString();
  const unlocked = checkAchievements(user);
  Users.save(user);
  GlobalStats.addSmile();
  CommunityGoal.contribute(1);

  const successStage = document.getElementById('smile-stage-success');
  successStage.classList.remove('hidden');
  document.getElementById('smile-points-gain').textContent = `+${pointsGained}`;
  document.getElementById('smile-streak-value').textContent = user.streak;

  if(typeof refreshHomeStats === 'function') refreshHomeStats();
  if(typeof renderNavbarStats === 'function') renderNavbarStats();

  if(unlocked.length){
    setTimeout(()=> showToast(`Achievement unlocked: ${unlocked[0].title}`, 'success'), 700);
  }
}

function checkAchievements(user){
  const unlocked = [];
  const has = (id)=> user.achievements.includes(id);
  const grant = (id)=>{ if(!has(id)){ user.achievements.push(id); unlocked.push(ACHIEVEMENT_DEFS.find(a=>a.id===id)); } };

  if(user.smiles >= 1) grant('first_smile');
  if(Thoughts.byUser(user.id).length >= 1) grant('first_step');
  if(user.streak >= 7) grant('spark_7');
  if(user.smiles >= 50) grant('good_energy');
  const missionsDone = Missions.all().filter(m=>m.completed).length;
  if(missionsDone >= 25) grant('kindness_builder');

  return unlocked;
}

document.addEventListener('DOMContentLoaded', initSmileFlow);