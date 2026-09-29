/* ============================================================
   SMILO — missions.js
   Keeps the daily mission set fresh across days. Weekly
   missions in this prototype simply persist until completed
   (a real backend would roll them on a 7-day cadence).
   ============================================================ */
function resetDailyMissionsIfNeeded(){
  const missions = Missions.all();
  const today = new Date().toISOString().slice(0,10);
  let changed = false;
  missions.forEach(m=>{
    if(m.type==='daily' && m.date !== today){
      m.date = today;
      m.completed = false;
      changed = true;
    }
  });
  if(changed) Missions.save(missions);
}
resetDailyMissionsIfNeeded();
