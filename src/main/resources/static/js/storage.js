/* ============================================================
   SMILO — storage.js
   Frontend data layer. Everything here is a stand-in for a
   real backend/database. Every function is written so a real
   API client could be dropped in behind the same interface.
   ============================================================ */

const DB_KEYS = {
  users: 'smilo_users',
  session: 'smilo_session',
  thoughts: 'smilo_thoughts',
  friendRequests: 'smilo_friend_requests',
  friendships: 'smilo_friendships',
  chats: 'smilo_chats',
  missions: 'smilo_missions',
  achievements: 'smilo_achievements',
  community: 'smilo_community_goal',
  globalStats: 'smilo_global_stats',
  seeded: 'smilo_seeded_v2',
  prefs: 'smilo_prefs'
};

const DB = {
  get(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ console.error('Storage read error', key, e); return fallback; }
  },
  set(key, value){
    try{
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }catch(e){ console.error('Storage write error', key, e); return false; }
  }
};

function uid(prefix='id'){
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

function escapeHTML(str){
  if(str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function timeAgo(iso){
  const diff = Math.floor((Date.now() - new Date(iso).getTime())/1000);
  if(diff < 60) return 'just now';
  if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if(diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if(diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined,{month:'short',day:'numeric'});
}

/* ---------------- Demo seed data ---------------- */
const DEMO_NAMES = [
  {name:'Alex Morgan', username:'alexmorgan', interests:['Technology','Fitness','Travel']},
  {name:'Riya Sharma', username:'riyasharma', interests:['Art','Music','Books']},
  {name:'Aarav Patel', username:'aaravpatel', interests:['Gaming','Technology','Sports']},
  {name:'Meera Kapoor', username:'meerakapoor', interests:['Personal Growth','Books','Education']},
  {name:'Kabir Singh', username:'kabirsingh', interests:['Sports','Fitness','Music']},
  {name:'Anaya Gupta', username:'anayagupta', interests:['Travel','Art','Education']},
  {name:'Dev Malhotra', username:'devmalhotra', interests:['Technology','Gaming','Personal Growth']}
];

const AVATAR_SEED = (seed) => `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=fde3d8,e2f1fa,dff5ec,f4b93e`;

const DEMO_THOUGHTS = [
  "Finally finished the project I've been putting off for weeks. Small wins count.",
  "Grateful for the little things today — good coffee, a quiet morning, and a walk with no destination.",
  "Learned that consistency beats intensity. Showing up every day at 60% beats one day at 100%.",
  "Reminder to the group project team: you all made today so much easier. Thank you.",
  "Tried a new recipe tonight and it actually worked. Small victories deserve celebration.",
  "Spent the afternoon helping a friend move. Tired, but it felt good to be useful.",
  "Started learning to sketch again after years away from it. Rusty, but happy.",
  "Someone let me go ahead of them in line today and it completely changed my mood.",
  "Three years into this city and I'm finally starting to feel like it's home.",
  "Sent a long overdue message to an old friend. Sometimes the hardest part is just starting.",
  "Watched the sunrise on my way to an early class. Worth losing the sleep for.",
  "Today's mission complete: told a coworker their work actually made a difference. It clearly meant a lot.",
];

function seedIfNeeded(){
  if(DB.get(DB_KEYS.seeded, false)) return;

  const users = DEMO_NAMES.map((p,i)=>({
    id: `u_${i+1}`,
    name: p.name,
    username: p.username,
    email: `${p.username}@smilo.demo`,
    password: 'demo1234',
    avatar: AVATAR_SEED(p.username),
    bio: demoBio(p),
    points: 300 + Math.floor(Math.random()*900),
    smiles: 20 + Math.floor(Math.random()*140),
    streak: 1 + Math.floor(Math.random()*18),
    longestStreak: 5 + Math.floor(Math.random()*30),
    interests: p.interests,
    friends: [],
    achievements: ['first_step','first_smile'],
    createdAt: new Date(Date.now() - Math.random()*1000*60*60*24*60).toISOString(),
    lastActivityDate: new Date(Date.now() - Math.floor(Math.random()*2)*86400000).toISOString(),
    positiveMode: false
  }));

  // make a friend web among demo users
  const friendships = [];
  users.forEach((u,i)=>{
    const friendIdx = [(i+1)%users.length, (i+2)%users.length];
    friendIdx.forEach(fi=>{
      const a=u.id, b=users[fi].id;
      if(a!==b && !friendships.find(f=>(f.a===a&&f.b===b)||(f.a===b&&f.b===a))){
        friendships.push({id: uid('fr'), a, b, createdAt: new Date().toISOString()});
      }
    });
  });
  DB.set(DB_KEYS.friendships, friendships);
  users.forEach(u=>{
    u.friends = friendships.filter(f=>f.a===u.id||f.b===u.id).map(f=>f.a===u.id?f.b:f.a);
  });
  DB.set(DB_KEYS.users, users);

  const thoughts = [];
  users.forEach((u)=>{
    const count = 1 + Math.floor(Math.random()*2);
    for(let i=0;i<count;i++){
      thoughts.push({
        id: uid('th'),
        userId: u.id,
        content: DEMO_THOUGHTS[Math.floor(Math.random()*DEMO_THOUGHTS.length)],
        visibility: Math.random() > 0.3 ? 'global' : 'friends',
        createdAt: new Date(Date.now() - Math.random()*1000*60*60*24*5).toISOString(),
        reactions: { smile: rnd(0,40), inspired: rnd(0,20), relatable: rnd(0,25), worth_sharing: rnd(0,15) },
        myReactions: [],
        comments: [],
        shares: rnd(0,10)
      });
    }
  });
  DB.set(DB_KEYS.thoughts, thoughts);

  DB.set(DB_KEYS.friendRequests, []);

  // demo chats (conversation with 2 demo users + Smilo Assist handled separately)
  const chats = users.slice(0,3).map((u,i)=>({
    id: uid('chat'),
    withUserId: u.id,
    messages: demoConversation(u.name, i),
    updatedAt: new Date(Date.now() - i*3600000).toISOString(),
    unread: i===0 ? 1 : 0
  }));
  DB.set(DB_KEYS.chats, chats);

  DB.set(DB_KEYS.missions, defaultMissions());

  DB.set(DB_KEYS.community, {
    id: 'goal_1',
    title: 'Autumn Smile Wave',
    target: 50000,
    current: 41280,
    participants: 6540,
    completed: false
  });

  DB.set(DB_KEYS.globalStats, {
    totalSmiles: 284912,
    smilesToday: 3421,
    activeUsers: 12043,
    thoughtsShared: 58211,
    activeStreaks: 4310
  });

  DB.set(DB_KEYS.seeded, true);
}

function demoBio(p){
  const bios = {
    'Technology': "Building things and breaking them again. Always curious.",
    'Art': "Finding color in ordinary days.",
    'Gaming': "Here for the side quests, staying for the community.",
    'Personal Growth': "One percent better, most days.",
    'Sports': "Runner, occasional overthinker.",
    'Travel': "Collecting stamps and good mornings.",
  };
  return bios[p.interests[0]] || "Just here to share something worth smiling about.";
}

function rnd(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

function demoConversation(name, i){
  const sets = [
    [["them","Hey! Loved your thought about the sunrise walk 🙂"],["me","Thank you! It's become a little ritual now."],["them","That's a great habit to have. Mind if I steal it?"]],
    [["them","Are you joining this week's community goal push?"],["me","Yes! Already at a 6 day streak, trying to keep it going."],["them","Let's keep each other accountable then"]],
    [["them","Congrats on the streak milestone 🔥"],["me","Thanks, feels good to actually see it add up."]]
  ];
  const set = sets[i % sets.length];
  const base = Date.now() - (set.length)*1000*60*40;
  return set.map((m,idx)=>({
    id: uid('msg'),
    from: m[0]==='me' ? 'me' : 'them',
    text: m[1],
    createdAt: new Date(base + idx*1000*60*40).toISOString()
  }));
}

function defaultMissions(){
  const today = new Date().toISOString().slice(0,10);
  return [
    {id:'m1', title:'Make someone smile today', description:'Send an encouraging message or reaction to someone.', reward:15, type:'daily', date:today, completed:false},
    {id:'m2', title:'Share something you are grateful for', description:'Post a thought about something good, however small.', reward:15, type:'daily', date:today, completed:false},
    {id:'m3', title:'Complete a positive action', description:'Verify a smile or finish another mission today.', reward:10, type:'daily', date:today, completed:false},
    {id:'m4', title:'Encourage someone', description:'React or comment on a friend\'s thought.', reward:10, type:'weekly', date:today, completed:false},
    {id:'m5', title:'Share something you learned', description:'Post a reflection on something new this week.', reward:15, type:'weekly', date:today, completed:false}
  ];
}

const ACHIEVEMENT_DEFS = [
  {id:'first_step', title:'First Step', desc:'Shared your first thought.', icon:'fa-seedling'},
  {id:'first_smile', title:'First Smile', desc:'Verified your first smile.', icon:'fa-face-smile'},
  {id:'spark_7', title:'7-Day Spark', desc:'Reached a 7-day streak.', icon:'fa-fire'},
  {id:'good_energy', title:'Good Energy', desc:'Made 50 people smile.', icon:'fa-handshake'},
  {id:'global_voice', title:'Global Voice', desc:'A thought reached 1,000 people.', icon:'fa-earth-americas'},
  {id:'kindness_builder', title:'Kindness Builder', desc:'Completed 25 missions.', icon:'fa-heart'}
];

/* ---------------- CRUD helpers ---------------- */
const Users = {
  all(){ return DB.get(DB_KEYS.users, []); },
  byId(id){ return this.all().find(u=>u.id===id); },
  byEmail(email){ return this.all().find(u=>u.email.toLowerCase()===String(email).toLowerCase()); },
  byUsername(username){ return this.all().find(u=>u.username.toLowerCase()===String(username).toLowerCase()); },
  save(user){
    const users = this.all();
    const idx = users.findIndex(u=>u.id===user.id);
    if(idx>=0) users[idx]=user; else users.push(user);
    DB.set(DB_KEYS.users, users);
    if(Session.current()?.id === user.id) Session.set(user.id);
    return user;
  }
};

const Session = {
  set(userId){ DB.set(DB_KEYS.session, {userId, at: Date.now()}); },
  clear(){ localStorage.removeItem(DB_KEYS.session); },
  current(){
    const s = DB.get(DB_KEYS.session, null);
    if(!s) return null;
    return Users.byId(s.userId) || null;
  },
  isAuthed(){ return !!this.current(); }
};

const Thoughts = {
  all(){ return DB.get(DB_KEYS.thoughts, []); },
  save(list){ DB.set(DB_KEYS.thoughts, list); },
  byUser(userId){ return this.all().filter(t=>t.userId===userId); },
  add(t){ const list=this.all(); list.unshift(t); this.save(list); return t; },
  remove(id){ this.save(this.all().filter(t=>t.id!==id)); },
  update(id, patch){
    const list = this.all();
    const idx = list.findIndex(t=>t.id===id);
    if(idx>=0){ list[idx] = {...list[idx], ...patch}; this.save(list); return list[idx]; }
    return null;
  }
};

const Friends = {
  requests(){ return DB.get(DB_KEYS.friendRequests, []); },
  saveRequests(l){ DB.set(DB_KEYS.friendRequests, l); },
  friendships(){ return DB.get(DB_KEYS.friendships, []); },
  saveFriendships(l){ DB.set(DB_KEYS.friendships, l); },
  areFriends(a,b){ return this.friendships().some(f=>(f.a===a&&f.b===b)||(f.a===b&&f.b===a)); },
  friendIdsOf(userId){
    return this.friendships().filter(f=>f.a===userId||f.b===userId).map(f=>f.a===userId?f.b:f.a);
  },
  pendingFromMe(userId){ return this.requests().filter(r=>r.senderId===userId && r.status==='pending'); },
  pendingToMe(userId){ return this.requests().filter(r=>r.receiverId===userId && r.status==='pending'); },
  sendRequest(senderId, receiverId){
    const list = this.requests();
    if(list.find(r=>r.senderId===senderId && r.receiverId===receiverId && r.status==='pending')) return null;
    const req = {id:uid('freq'), senderId, receiverId, status:'pending', createdAt:new Date().toISOString()};
    list.push(req); this.saveRequests(list); return req;
  },
  respond(reqId, accept){
    const list = this.requests();
    const idx = list.findIndex(r=>r.id===reqId);
    if(idx<0) return null;
    list[idx].status = accept ? 'accepted' : 'declined';
    this.saveRequests(list);
    if(accept){
      const fs = this.friendships();
      fs.push({id:uid('fr'), a:list[idx].senderId, b:list[idx].receiverId, createdAt:new Date().toISOString()});
      this.saveFriendships(fs);
    }
    return list[idx];
  },
  remove(userId, otherId){
    this.saveFriendships(this.friendships().filter(f=>!((f.a===userId&&f.b===otherId)||(f.a===otherId&&f.b===userId))));
  }
};

const Chats = {
  all(){ return DB.get(DB_KEYS.chats, []); },
  save(l){ DB.set(DB_KEYS.chats, l); },
  byId(id){ return this.all().find(c=>c.id===id); },
  byUserId(uidOther){ return this.all().find(c=>c.withUserId===uidOther); },
  ensureFor(otherUserId){
    let c = this.byUserId(otherUserId);
    if(!c){
      c = {id:uid('chat'), withUserId:otherUserId, messages:[], updatedAt:new Date().toISOString(), unread:0};
      const l = this.all(); l.push(c); this.save(l);
    }
    return c;
  },
  addMessage(chatId, from, text){
    const l = this.all();
    const idx = l.findIndex(c=>c.id===chatId);
    if(idx<0) return null;
    l[idx].messages.push({id:uid('msg'), from, text, createdAt:new Date().toISOString()});
    l[idx].updatedAt = new Date().toISOString();
    this.save(l);
    return l[idx];
  }
};

const Missions = {
  all(){ return DB.get(DB_KEYS.missions, defaultMissions()); },
  save(l){ DB.set(DB_KEYS.missions, l); },
  complete(id){
    const l = this.all();
    const idx = l.findIndex(m=>m.id===id);
    if(idx<0 || l[idx].completed) return null;
    l[idx].completed = true;
    this.save(l);
    return l[idx];
  }
};

const CommunityGoal = {
  get(){ return DB.get(DB_KEYS.community, {title:'Autumn Smile Wave', target:50000, current:41280, participants:6540, completed:false}); },
  save(g){ DB.set(DB_KEYS.community, g); },
  contribute(amount){
    const g = this.get();
    g.current = Math.min(g.target, g.current + amount);
    if(g.current >= g.target) g.completed = true;
    this.save(g);
    return g;
  }
};

const GlobalStats = {
  get(){ return DB.get(DB_KEYS.globalStats, {totalSmiles:284912, smilesToday:3421, activeUsers:12043, thoughtsShared:58211, activeStreaks:4310}); },
  save(s){ DB.set(DB_KEYS.globalStats, s); },
  addSmile(){
    const s = this.get();
    s.totalSmiles += 1; s.smilesToday += 1;
    this.save(s);
    return s;
  },
  addThought(){
    const s = this.get();
    s.thoughtsShared += 1;
    this.save(s);
    return s;
  }
};

const Prefs = {
  get(){ return DB.get(DB_KEYS.prefs, {feedMode:'normal', reducedTopics:[]}); },
  save(p){ DB.set(DB_KEYS.prefs, p); }
};

seedIfNeeded();
