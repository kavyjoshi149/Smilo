/* ============================================================
   SMILO — notifications.js
   Lightweight, derived notifications (no separate notification
   log is persisted in this prototype — items are computed from
   current state so they can never go stale or duplicate).
   ============================================================ */
function getNotificationCount(user){
  if(!user) return 0;
  return Friends.pendingToMe(user.id).length;
}
