// Mock data for 6ix Back Volleyball
const VENUES = [
  { id:'v1', name:'Mattamy Athletic Centre', area:'Downtown', addr:'50 Carlton St' },
  { id:'v2', name:'Goldring Centre → UofT', area:'Annex', addr:'100 Devonshire Pl' },
  { id:'v3', name:'Variety Village', area:'Scarborough', addr:'3701 Danforth Ave' },
  { id:'v4', name:'North Toronto Memorial', area:'Midtown', addr:'200 Eglinton Ave W' },
  { id:'v5', name:'Bayview Glen Sports Hall', area:'North York', addr:'275 Duncan Mill Rd' },
  { id:'v6', name:'The Hangar → Downsview', area:'Downsview', addr:'75 Carl Hall Rd' },
];

const SKILLS = ['Beginner','Intermediate','Advanced','Competitive'];
const SKILL_DOTS = { Beginner:1, Intermediate:2, Advanced:3, Competitive:4 };

const HOSTS = [
  { id:'h1', name:'Marcus K.', email:'marcus.k@protonmail.com', rating:4.9, runs:42 },
  { id:'h2', name:'Priya S.', email:'priya.s@gmail.com', rating:4.8, runs:18 },
  { id:'h3', name:'Devon W.', email:'devonw.vb@outlook.com', rating:4.95, runs:71 },
  { id:'h4', name:'Cami L.', email:'cami.league@hotmail.com', rating:4.7, runs:24 },
];

// Helpers
const dt = (d, h, m=0) => {
  const x = new Date(); x.setDate(x.getDate()+d); x.setHours(h,m,0,0); return x.toISOString();
};

const DROPINS = [
  { id:'d1', kind:'dropin', title:'Tuesday Co-ed 6s', host:HOSTS[0], venue:VENUES[0], skill:'Intermediate', start:dt(1,19), durationMin:120, price:15, capacity:18, signed:14, format:'Co-ed 6s → 3 courts', tag:'Most popular' },
  { id:'d2', kind:'dropin', title:'Thursday Open Gym', host:HOSTS[1], venue:VENUES[1], skill:'Advanced', start:dt(3,20), durationMin:120, price:18, capacity:24, signed:24, format:'Co-ed 6s → A/B sides', tag:'Wait‑list' },
  { id:'d3', kind:'dropin', title:'Sunday Funday', host:HOSTS[2], venue:VENUES[3], skill:'Beginner', start:dt(5,15), durationMin:180, price:12, capacity:24, signed:9, format:'Co-ed 6s → coached drills', tag:'Beginner-friendly' },
  { id:'d4', kind:'dropin', title:'Friday Late Night', host:HOSTS[3], venue:VENUES[4], skill:'Competitive', start:dt(4,21,30), durationMin:120, price:20, capacity:18, signed:17, format:'Co-ed 6s → refs on', tag:null },
  { id:'d5', kind:'dropin', title:'Wednesday Mixer', host:HOSTS[0], venue:VENUES[0], skill:'Intermediate', start:dt(2,19,30), durationMin:120, price:15, capacity:18, signed:11, format:'Co-ed 6s', tag:null },
  { id:'d6', kind:'dropin', title:'Saturday Brunch Ball', host:HOSTS[1], venue:VENUES[5], skill:'Beginner', start:dt(6,11), durationMin:180, price:14, capacity:24, signed:6, format:'Co-ed 6s → drills + games', tag:'New' },
];

const LEAGUES = [
  { id:'l1', kind:'league', title:'Spring Co-ed 6s → Tuesday A', host:HOSTS[0], venue:VENUES[0], skill:'Advanced', startDate:dt(7,19), nights:8, pricePerTeam:680, teamCap:8, teamsIn:7, format:'8 weeks · 2 games/night · playoffs' },
  { id:'l2', kind:'league', title:'Spring Co-ed 6s → Wednesday B', host:HOSTS[3], venue:VENUES[3], skill:'Intermediate', startDate:dt(8,19,30), nights:8, pricePerTeam:580, teamCap:10, teamsIn:5, format:'8 weeks · 2 games/night · playoffs' },
  { id:'l3', kind:'league', title:'Summer Co-ed 6s → Sunday Rec', host:HOSTS[2], venue:VENUES[4], skill:'Beginner', startDate:dt(20,14), nights:10, pricePerTeam:520, teamCap:8, teamsIn:3, format:'10 weeks · skills clinic + games' },
];

const TOURNAMENTS = [
  { id:'t1', kind:'tournament', title:'6ix Back Spring Open', host:HOSTS[2], venue:VENUES[0], skill:'Competitive', date:dt(11,9), pricePerTeam:240, teamCap:16, teamsIn:11, format:'16 teams · pool play → bracket', prize:'$1,200 + jersey' },
  { id:'t2', kind:'tournament', title:'Co-ed Beginner Bash', host:HOSTS[1], venue:VENUES[5], skill:'Beginner', date:dt(14,10), pricePerTeam:180, teamCap:12, teamsIn:8, format:'12 teams · round robin', prize:'Trophy + free drop-ins' },
];

const ALL_EVENTS = [...DROPINS, ...LEAGUES, ...TOURNAMENTS];

// Roster sample for host view
const ROSTER = [
  { id:'p1', name:'Aisha Rahman', email:'aisha.r@gmail.com', skill:'Intermediate', signedAt:'2 days ago', paid:'received', amount:15, ref:'6B-AS-7401' },
  { id:'p2', name:'Tyler Chen', email:'tchen.vb@outlook.com', skill:'Advanced', signedAt:'2 days ago', paid:'received', amount:15, ref:'6B-TC-7402' },
  { id:'p3', name:'Maria Lopez', email:'maria.l@me.com', skill:'Intermediate', signedAt:'1 day ago', paid:'sent', amount:15, ref:'6B-ML-7403' },
  { id:'p4', name:'Jordan Park', email:'jpark@protonmail.com', skill:'Intermediate', signedAt:'1 day ago', paid:'received', amount:15, ref:'6B-JP-7404' },
  { id:'p5', name:'Sam O\u2019Brien', email:'sam.ob@gmail.com', skill:'Advanced', signedAt:'18h ago', paid:'pending', amount:15, ref:'6B-SO-7405' },
  { id:'p6', name:'Nadia Petrov', email:'nadia.p@yahoo.ca', skill:'Intermediate', signedAt:'12h ago', paid:'received', amount:15, ref:'6B-NP-7406' },
  { id:'p7', name:'Wes Holloway', email:'wes.h@gmail.com', skill:'Intermediate', signedAt:'8h ago', paid:'pending', amount:15, ref:'6B-WH-7407' },
  { id:'p8', name:'Kenji Tanaka', email:'kenji.t@gmail.com', skill:'Advanced', signedAt:'6h ago', paid:'received', amount:15, ref:'6B-KT-7408' },
  { id:'p9', name:'Lia Martins', email:'lia.m@hotmail.com', skill:'Intermediate', signedAt:'3h ago', paid:'sent', amount:15, ref:'6B-LM-7409' },
  { id:'p10', name:'Owen Brar', email:'owenb@me.com', skill:'Intermediate', signedAt:'1h ago', paid:'pending', amount:15, ref:'6B-OB-7410' },
  { id:'p11', name:'Jess Whitman', email:'jw.serve@gmail.com', skill:'Advanced', signedAt:'45m ago', paid:'pending', amount:15, ref:'6B-JW-7411' },
  { id:'p12', name:'Reza Aslan', email:'reza.a@gmail.com', skill:'Intermediate', signedAt:'40m ago', paid:'pending', amount:15, ref:'6B-RA-7412' },
  { id:'p13', name:'Hana Kim', email:'hana.k@outlook.com', skill:'Intermediate', signedAt:'30m ago', paid:'pending', amount:15, ref:'6B-HK-7413' },
  { id:'p14', name:'Diego Ortiz', email:'d.ortiz@gmail.com', skill:'Advanced', signedAt:'20m ago', paid:'pending', amount:15, ref:'6B-DO-7414' },
];

// Format helpers
function formatDay(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('en-CA',{weekday:'short',month:'short',day:'numeric'});
}
function formatTime(iso){
  const d = new Date(iso);
  return d.toLocaleTimeString('en-CA',{hour:'numeric',minute:'2-digit',hour12:true}).toLowerCase().replace(' ','');
}
function formatRange(iso, durMin){
  const a = new Date(iso); const b = new Date(a.getTime()+durMin*60000);
  const f = (x)=>x.toLocaleTimeString('en-CA',{hour:'numeric',minute:'2-digit',hour12:true}).toLowerCase().replace(' ','');
  return `${f(a)} – ${f(b)}`;
}
function dayBig(iso){ // returns {dow, num, mon}
  const d = new Date(iso);
  return {
    dow: d.toLocaleDateString('en-CA',{weekday:'short'}).toUpperCase(),
    num: d.getDate(),
    mon: d.toLocaleDateString('en-CA',{month:'short'}).toUpperCase(),
  };
}

Object.assign(window, {
  VENUES, SKILLS, SKILL_DOTS, HOSTS, DROPINS, LEAGUES, TOURNAMENTS, ALL_EVENTS, ROSTER,
  formatDay, formatTime, formatRange, dayBig
});
