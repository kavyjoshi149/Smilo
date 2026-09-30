/* ============================================================
   SMILO — smile.js
   Real smile verification via POST /api/user/smile-photo.
   "Take Photo" opens the device camera live (getUserMedia),
   captures a single frame on demand, and uploads that frame —
   no continuous recording, nothing saved to disk client-side.
   ============================================================ */

function authHeaders(){
  const token = localStorage.getItem('smilo_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

let cameraStream = null;

function openSmileModal(){
  resetSmileModal();
  openModal('smile-modal');
}

function resetSmileModal(){
  stopCamera();
  document.getElementById('smile-stage-choose')?.classList.remove('hidden');
  document.getElementById('smile-stage-camera')?.classList.add('hidden');
  document.getElementById('smile-stage-analyzing')?.classList.add('hidden');
  document.getElementById('smile-stage-success')?.classList.add('hidden');
  document.getElementById('smile-stage-failed')?.classList.add('hidden');
  const input = document.getElementById('smile-file-input');
  if(input) input.value = '';
}

/* ---------------- Camera flow ---------------- */

async function openCamera(){
  document.getElementById('smile-stage-choose').classList.add('hidden');
  document.getElementById('smile-stage-camera').classList.remove('hidden');

  const video = document.getElementById('smile-camera-video');

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    });
    video.srcObject = cameraStream;
  } catch (err) {
    showToast('Could not access your camera. Check permissions, or upload an image instead.', 'error');
    stopCamera();
    document.getElementById('smile-stage-camera').classList.add('hidden');
    document.getElementById('smile-stage-choose').classList.remove('hidden');
  }
}

function stopCamera(){
  if(cameraStream){
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  const video = document.getElementById('smile-camera-video');
  if(video) video.srcObject = null;
}

function capturePhoto(){
  const video = document.getElementById('smile-camera-video');
  const canvas = document.getElementById('smile-camera-canvas');
  if(!video || !video.videoWidth){
    showToast('Camera is still loading — try again in a moment.', 'error');
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  // mirror the capture to match the mirrored live preview, so the
  // uploaded photo looks the same as what the user saw on screen
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob)=>{
    stopCamera();
    document.getElementById('smile-stage-camera').classList.add('hidden');
    if(blob){
      const file = new File([blob], 'smile-capture.jpg', { type: 'image/jpeg' });
      runSmileVerification(file);
    } else {
      showToast('Could not capture that photo. Try again.', 'error');
      document.getElementById('smile-stage-choose').classList.remove('hidden');
    }
  }, 'image/jpeg', 0.92);
}

/* ---------------- Wiring ---------------- */

function initSmileFlow(){
  const modal = document.getElementById('smile-modal');
  if(!modal) return;

  const fileInput = document.getElementById('smile-file-input');

  document.getElementById('smile-choose-file-btn')?.addEventListener('click', ()=>{
    fileInput.click();
  });

  // "Take Photo" now opens a real live camera instead of the file picker
  document.getElementById('smile-simulate-btn')?.addEventListener('click', openCamera);

  document.getElementById('smile-camera-capture-btn')?.addEventListener('click', capturePhoto);

  document.getElementById('smile-camera-cancel-btn')?.addEventListener('click', ()=>{
    stopCamera();
    document.getElementById('smile-stage-camera').classList.add('hidden');
    document.getElementById('smile-stage-choose').classList.remove('hidden');
  });

  fileInput?.addEventListener('change', (e)=>{
    if(e.target.files && e.target.files[0]){
      runSmileVerification(e.target.files[0]);
    }
  });

  document.getElementById('smile-try-again-btn')?.addEventListener('click', resetSmileModal);

  // release the camera if the user closes the modal mid-capture
  modal.querySelectorAll('[data-modal-close]').forEach(btn=>{
    btn.addEventListener('click', stopCamera);
  });
  modal.addEventListener('click', (e)=>{
    if(e.target === modal) stopCamera();
  });
}

async function runSmileVerification(file){
  document.getElementById('smile-stage-choose').classList.add('hidden');
  document.getElementById('smile-stage-camera').classList.add('hidden');
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