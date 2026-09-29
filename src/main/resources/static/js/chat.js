/* ============================================================
   SMILO — chat.js
   Real-time conversations via WebSocket/STOMP (/ws), history
   loaded via /api/chat/conversations, and SMILO Assist via
   /api/chat/assist (Gemini-backed on the server).
   ============================================================ */
const ASSIST_ID = 'smilo-assist';
let activeChatId = null;       // conversationId, or otherUserId when opening fresh, or ASSIST_ID
let activeOtherUserId = null;  // needed to send/fetch messages for a real conversation
let conversationsCache = [];
let stompClient = null;

function authHeaders(){
  const token = localStorage.getItem('smilo_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function connectSocket(){
  const token = localStorage.getItem('smilo_jwt');
  if(!token) return;

  const socket = new SockJS('/ws');
  stompClient = Stomp.over(socket);
  stompClient.debug = null; // silence console spam

  stompClient.connect({ Authorization: `Bearer ${token}` }, () => {
    stompClient.subscribe('/user/queue/messages', (frame) => {
      const message = JSON.parse(frame.body);
      handleIncomingMessage(message);
    });
  }, (err) => {
    console.warn('WebSocket connection failed:', err);
  });
}

function handleIncomingMessage(message){
  if(activeOtherUserId && message.senderId === activeOtherUserId){
    loadMessages(activeOtherUserId);
  } else {
    renderChatList();
  }
}

function initChatPage(){
  if(currentPageName() !== 'chat.html') return;
  const user = Session.current();
  if(!user) return;

  connectSocket(); // NEW — was defined but never invoked
  renderChatList();

  const params = new URLSearchParams(location.search);
  if(params.get('assist')){
    openAssist();
  } else if(params.get('u')){
    openConversationWithUser(params.get('u'));
  }

  document.getElementById('chat-search')?.addEventListener('input', renderChatList);

  document.getElementById('chat-send-btn')?.addEventListener('click', sendChatMessage);
  document.getElementById('chat-input')?.addEventListener('keydown', (e)=>{
    if(e.key==='Enter'){ e.preventDefault(); sendChatMessage(); }
  });

  document.getElementById('chat-back-btn')?.addEventListener('click', ()=>{
    document.querySelector('.chat-shell').classList.remove('chat-open');
  });
}

async function renderChatList(){
  const el = document.getElementById('chat-list-items');
  if(!el) return;
  const query = (document.getElementById('chat-search')?.value || '').trim().toLowerCase();

  try {
    const res = await fetch('/api/chat/conversations', { headers: authHeaders() });
    conversationsCache = res.ok ? await res.json() : [];
  } catch (err) {
    conversationsCache = [];
  }

  const assistItem = {
    id: ASSIST_ID, isAssist:true,
    name:'SMILO Assist', avatarIcon:'fa-comment-dots',
    lastMessage:'Need a little help putting something into words?',
    updatedAt: new Date().toISOString(), unread:0
  };

  let items = [assistItem, ...conversationsCache.map(c=>({
    id: c.conversationId,
    otherUserId: c.otherUserId,
    name: c.otherName || c.otherUserName,
    avatar: c.otherAvatarUrl,
    lastMessage: c.lastMessage || 'Say hello 👋',
    updatedAt: c.updatedAt,
    unread: c.unreadCount
  }))];

  if(query) items = items.filter(i=>i.name.toLowerCase().includes(query));

  el.innerHTML = items.map(i=>`
    <div class="chat-item ${activeChatId===i.id?'active':''}" data-open-chat="${i.id}" data-other-user="${i.otherUserId||''}">
      <div class="av-wrap">
        ${i.isAssist
          ? `<div class="avatar avatar-48" style="display:flex;align-items:center;justify-content:center;background:var(--color-primary-light);color:var(--color-primary);font-size:18px;"><i class="fa-solid ${i.avatarIcon}"></i></div>`
          : `<img src="${i.avatar}" class="avatar avatar-48" alt="">`}
        ${!i.isAssist ? `<span class="status-dot"></span>` : ''}
      </div>
      <div class="txt">
        <div class="top"><b>${escapeHTML(i.name)}</b><span class="time">${timeAgo(i.updatedAt)}</span></div>
        <p>${escapeHTML(i.lastMessage)}</p>
      </div>
      ${i.unread>0 ? `<span class="unread-dot">${i.unread}</span>` : ''}
    </div>`).join('');
}

async function openConversationWithUser(otherUserId){
  const target = conversationsCache.find(c=>c.otherUserId===otherUserId);
  activeChatId = target ? target.conversationId : otherUserId;
  activeOtherUserId = otherUserId;
  document.querySelector('.chat-shell')?.classList.add('chat-open');
  renderChatList();
  document.getElementById('assist-suggestions').classList.add('hidden');

  const known = conversationsCache.find(c=>c.otherUserId===otherUserId);
  document.getElementById('chat-header-body').innerHTML = `
    <img src="${known?.otherAvatarUrl || ''}" class="avatar avatar-40" alt="">
    <div class="txt"><b>${escapeHTML(known?.otherName || known?.otherUserName || 'Conversation')}</b><span>Active now</span></div>
    <div class="spacer"></div>
  `;

  await loadMessages(otherUserId);
}

async function loadMessages(otherUserId){
  const el = document.getElementById('chat-messages');
  try {
    const res = await fetch(`/api/chat/conversations/${otherUserId}/messages`, { headers: authHeaders() });
    const messages = res.ok ? await res.json() : [];
    el.innerHTML = messages.map(m=>`
      <div class="msg-row ${m.mine?'mine':''}">
        <div><div class="msg-bubble">${escapeHTML(m.content)}</div><span class="msg-time">${timeAgo(m.createdAt)}</span></div>
      </div>`).join('');
    el.scrollTop = el.scrollHeight;
    renderChatList(); // refresh unread counts
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><p>Could not load messages.</p></div>`;
  }
}

function sendRealtimeMessage(otherUserId, content){
  if(!stompClient || !stompClient.connected){
    showToast('Not connected — reconnecting...', 'error');
    connectSocket();
    return false;
  }
  stompClient.send(`/app/chat.send/${otherUserId}`, {}, JSON.stringify({ content }));
  return true;
}

// RESTORED — this function was missing entirely; it's why send did nothing
async function sendChatMessage(){
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if(!text || !activeChatId) return;
  input.value='';

  if(activeChatId === ASSIST_ID){
    appendAssistMessage('me', text);
    showTypingIndicator();
    try {
      const res = await fetch('/api/chat/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      hideTypingIndicator();
      appendAssistMessage('them', res.ok ? data.reply : "I'm having trouble responding right now — try again in a moment.");
    } catch (err) {
      hideTypingIndicator();
      appendAssistMessage('them', "I couldn't reach the server just now.");
    }
    return;
  }

  if(!activeOtherUserId) return;
  sendRealtimeMessage(activeOtherUserId, text);
  // no manual loadMessages() call here — the server echoes the saved
  // message back over the socket to both participants, which is what
  // actually triggers the reload (see handleIncomingMessage)
}

/* ---------------- SMILO Assist ---------------- */
let assistMessages = [
  {from:'them', text:"Hi, I'm Smilo Assist. I'm here to help — never posted publicly without you choosing to. What's on your mind?", createdAt:new Date().toISOString()}
];

function openAssist(){
  activeChatId = ASSIST_ID;
  activeOtherUserId = null;
  document.querySelector('.chat-shell')?.classList.add('chat-open');
  renderChatList();
  renderAssistConversation();
}

function renderAssistConversation(){
  document.getElementById('chat-header-body').innerHTML = `
    <div class="avatar avatar-40" style="display:flex;align-items:center;justify-content:center;background:var(--color-primary-light);color:var(--color-primary);"><i class="fa-solid fa-comment-dots"></i></div>
    <div class="txt"><b>SMILO Assist</b><span>Private · never posted automatically</span></div>
    <div class="spacer"></div>
  `;
  document.getElementById('assist-suggestions').classList.remove('hidden');
  renderAssistMessages();
}

function renderAssistMessages(){
  const el = document.getElementById('chat-messages');
  el.innerHTML = assistMessages.map(m=>`
    <div class="msg-row ${m.from==='me'?'mine':''}">
      <div><div class="msg-bubble">${escapeHTML(m.text)}</div><span class="msg-time">${timeAgo(m.createdAt)}</span></div>
    </div>`).join('');
  el.scrollTop = el.scrollHeight;
}

function appendAssistMessage(from, text){
  assistMessages.push({from, text, createdAt:new Date().toISOString()});
  renderAssistMessages();
}

function showTypingIndicator(){
  const el = document.getElementById('chat-messages');
  const row = document.createElement('div');
  row.className='msg-row'; row.id='typing-row';
  row.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
  el.appendChild(row);
  el.scrollTop = el.scrollHeight;
}
function hideTypingIndicator(){ document.getElementById('typing-row')?.remove(); }

document.addEventListener('click', (e)=>{
  const item = e.target.closest('[data-open-chat]');
  if(item){
    const id = item.dataset.openChat;
    const otherUserId = item.dataset.otherUser;
    if(id === ASSIST_ID) openAssist();
    else openConversationWithUser(otherUserId);
  }

  const suggestion = e.target.closest('[data-assist-suggestion]');
  if(suggestion){
    const map = {
      boost: "I could use a mood boost today.",
      express: "Help me express what happened today.",
      improve: "Can you help me improve a thought I want to share?",
      mission: "Give me a mission I can do right now."
    };
    document.getElementById('chat-input').value = map[suggestion.dataset.assistSuggestion] || '';
    sendChatMessage();
  }
});

document.addEventListener('DOMContentLoaded', initChatPage);