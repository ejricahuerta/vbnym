// Admin dashboard

function Admin({onNav}){
  const [tab, setTab] = React.useState('overview');
  const tabs = [
    {id:'overview', l:'Overview', ic:'gauge'},
    {id:'events', l:'Events', ic:'calendar'},
    {id:'hosts', l:'Hosts', ic:'users'},
    {id:'players', l:'Players', ic:'user'},
    {id:'venues', l:'Venues', ic:'map-pin'},
    {id:'flags', l:'Reports', ic:'flag'},
  ];
  return (
    <div>
      <section style={{background:'var(--ink)', color:'var(--paper)', borderBottom:'2px solid var(--ink)'}}>
        <div style={{maxWidth:1280, margin:'0 auto', padding:'40px 18px'}}>
          <div style={{display:'flex',alignItems:'center',gap:10, marginBottom:14}}>
            <span className="chip gold">ADMIN</span>
            <span className="mono" style={{fontSize:12, color:'rgba(251,248,241,.5)', letterSpacing:'.08em', fontWeight:600}}>SIGNED IN AS DEVON W.</span>
          </div>
          <h1 className="display" style={{fontSize:'clamp(44px, 8vw, 88px)', margin:'0 0 24px', letterSpacing:'-.04em'}}>Control <span className="serif-display" style={{fontStyle:'italic', textTransform:'lowercase', color:'var(--accent)'}}>room.</span></h1>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            {tabs.map(x=>(
              <button key={x.id} onClick={()=>setTab(x.id)} className="focusable"
                style={{
                  appearance:'none', cursor:'pointer', fontFamily:'var(--ui)', fontWeight:700, fontSize:12.5,
                  padding:'8px 13px', borderRadius:6, border:'2px solid var(--paper)',
                  background: tab===x.id?'var(--accent)':'transparent', color: tab===x.id?'var(--ink)':'var(--paper)',
                  textTransform:'uppercase', letterSpacing:'.04em',
                  display:'inline-flex', alignItems:'center', gap:6,
                  borderColor: tab===x.id?'var(--accent)':'var(--paper)'
                }}><Icon name={x.ic} size={13}/>{x.l}</button>
            ))}
          </div>
        </div>
      </section>

      <section style={{maxWidth:1280, margin:'0 auto', padding:'28px 18px 60px'}}>
        {tab==='overview' && <Overview/>}
        {tab==='events' && <EventsTable/>}
        {tab==='hosts' && <HostsTable/>}
        {tab==='players' && <PlayersTable/>}
        {tab==='venues' && <VenuesTable/>}
        {tab==='flags' && <Reports/>}
      </section>

      <Footer/>
    </div>
  );
}

function Overview(){
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:24}} className="grid grid-4">
        {[
          {l:'Active players', v:'1,840', delta:'+86 this wk', ic:'users', accent:true},
          {l:'Games this week', v:'38', delta:'31 drop-ins · 7 league', ic:'calendar'},
          {l:'Volume processed', v:'$28.4K', delta:'Interac, last 30d', ic:'banknote'},
          {l:'Open reports', v:'2', delta:'Both no-show flags', ic:'flag'},
        ].map((s,i)=>(
          <div key={i} className="card" style={{padding:18}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8}}>
              <div className="mono" style={{fontSize:10.5, letterSpacing:'.12em', color:'var(--ink-3)', fontWeight:700}}>{s.l.toUpperCase()}</div>
              <Icon name={s.ic} size={16} color="var(--ink-3)"/>
            </div>
            <div className="display" style={{fontSize:'clamp(28px, 4vw, 42px)', lineHeight:.9, letterSpacing:'-.03em'}}>{s.v}</div>
            <div className="mono" style={{fontSize:10.5, color:'var(--ink-3)', marginTop:8, letterSpacing:'.06em', fontWeight:600}}>{s.delta}</div>
            {s.accent && <div style={{height:3, background:'var(--accent)', marginTop:12, width:'40%'}}/>}
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{gridTemplateColumns:'1.4fr 1fr', gap:14}}>
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:14}}>
            <div>
              <div className="label">Sign-ups · last 14 days</div>
              <div className="display" style={{fontSize:32, letterSpacing:'-.03em'}}>+412</div>
            </div>
            <div className="mono" style={{fontSize:11, color:'var(--ink-3)', display:'inline-flex', alignItems:'center', gap:4, fontWeight:700}}><Icon name="trending-up" size={12} color="var(--ok)"/>vs +338 prev</div>
          </div>
          <BarChart/>
        </div>

        <div className="card">
          <div className="label">Activity feed</div>
          <ul style={{listStyle:'none', padding:0, margin:'12px 0 0', display:'flex', flexDirection:'column', gap:10}}>
            {[
              ['user-check','New host approved → <strong>Lia M.</strong>','3m ago','var(--ok)'],
              ['calendar-check','<strong>Tuesday Co-ed 6s</strong> filled wait-list','1h ago','var(--ink)'],
              ['banknote','Payment volume crossed <strong>$28K</strong> this month','2h ago','var(--ink)'],
              ['alert-triangle','No-show flag on <strong>Sam O.</strong> by Devon W.','5h ago','var(--warn)'],
              ['trophy','New tournament: <strong>Beginner Bash</strong>','yesterday','var(--ink)'],
              ['users','<strong>86 new players</strong> signed up','this week','var(--ink)'],
            ].map(([ic,t,when,col],i)=>(
              <li key={i} style={{display:'flex', gap:10, alignItems:'flex-start', borderBottom:i===5?'none':'1px dashed var(--ink-3)', paddingBottom:10}}>
                <span style={{width:28, height:28, borderRadius:6, background:'var(--bg)', border:'1.5px solid var(--ink)', display:'inline-grid', placeItems:'center', flexShrink:0}}><Icon name={ic} size={14} color={col}/></span>
                <div style={{flex:1, fontSize:13.5, lineHeight:1.45}} dangerouslySetInnerHTML={{__html:t}}/>
                <span className="mono" style={{fontSize:10.5, color:'var(--ink-3)', letterSpacing:'.06em', fontWeight:600}}>{when}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function BarChart(){
  const data = [12,18,14,22,28,35,40,32,29,38,42,48,52,46];
  const max = Math.max(...data);
  return (
    <div style={{display:'flex', alignItems:'flex-end', gap:8, height:170, padding:'8px 0', borderTop:'2px solid var(--ink)', borderBottom:'2px solid var(--ink)'}}>
      {data.map((v,i)=>(
        <div key={i} style={{flex:1, height:`${(v/max)*100}%`, background: i>=10?'var(--accent)':'var(--ink)', borderRadius:'2px 2px 0 0', position:'relative', border: i>=10?'1.5px solid var(--ink)':'none'}}>
          {i===data.length-1 && (
            <span className="mono" style={{position:'absolute', top:-22, left:'50%', transform:'translateX(-50%)', fontSize:11, fontWeight:700}}>52</span>
          )}
        </div>
      ))}
    </div>
  );
}

function EventsTable(){
  const list = ALL_EVENTS;
  return (
    <div className="card" style={{padding:0, overflow:'hidden'}}>
      <Th cols="2fr 1fr 1.4fr 1fr 1fr 0.8fr 90px"><div>Event</div><div>Type</div><div>Host</div><div>Date</div><div>Filled</div><div>Revenue</div><div></div></Th>
      {list.map((e,i)=>{
        const filled = e.kind==='dropin'?`${e.signed}/${e.capacity}`:`${e.teamsIn}/${e.teamCap}`;
        const revenue = e.kind==='dropin'?(e.signed*e.price):(e.teamsIn*(e.pricePerTeam||0));
        return (
          <Tr key={e.id} cols="2fr 1fr 1.4fr 1fr 1fr 0.8fr 90px" last={i===list.length-1}>
            <div style={{fontWeight:700, fontSize:14}}>{e.title}</div>
            <div><KindBadge kind={e.kind}/></div>
            <div style={{fontSize:13}}>{e.host.name}</div>
            <div className="mono" style={{fontSize:12, fontWeight:600}}>{formatDay(e.start||e.startDate||e.date)}</div>
            <div className="mono" style={{fontSize:13, fontWeight:700}}>{filled}</div>
            <div className="display" style={{fontSize:16, letterSpacing:'-.02em'}}>${revenue}</div>
            <div style={{textAlign:'right'}}><button className="btn xs ghost"><Icon name="eye" size={12}/> View</button></div>
          </Tr>
        );
      })}
    </div>
  );
}

function HostsTable(){
  return (
    <div className="card" style={{padding:0, overflow:'hidden'}}>
      <Th cols="2fr 2fr 0.8fr 1fr 1fr 90px"><div>Host</div><div>Interac email</div><div>Rating</div><div>Games</div><div>Volume 30d</div><div></div></Th>
      {HOSTS.map((h,i)=>(
        <Tr key={h.id} cols="2fr 2fr 0.8fr 1fr 1fr 90px" last={i===HOSTS.length-1}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:32, height:32, borderRadius:'50%', background:'var(--accent)', border:'2px solid var(--ink)', display:'grid', placeItems:'center', fontWeight:900, fontSize:11, fontFamily:'var(--display)'}}>{h.name.split(' ').map(n=>n[0]).join('')}</div>
            <span style={{fontWeight:700, fontSize:14}}>{h.name}</span>
          </div>
          <div className="mono" style={{fontSize:12.5}}>{h.email}</div>
          <div className="display" style={{fontSize:16, display:'inline-flex', alignItems:'center', gap:3, letterSpacing:'-.02em'}}><Icon name="star" size={12} color="var(--accent-deep)"/>{h.rating}</div>
          <div className="mono" style={{fontSize:13, fontWeight:700}}>{h.runs}</div>
          <div className="display" style={{fontSize:16, letterSpacing:'-.02em'}}>${(h.runs*15*8).toLocaleString()}</div>
          <div style={{textAlign:'right'}}><button className="btn xs ghost"><Icon name="settings" size={12}/> Manage</button></div>
        </Tr>
      ))}
    </div>
  );
}

function PlayersTable(){
  return (
    <div className="card" style={{padding:0, overflow:'hidden'}}>
      <Th cols="2fr 2fr 1fr 1fr 1fr 90px"><div>Player</div><div>Email</div><div>Skill</div><div>Games</div><div>Status</div><div></div></Th>
      {ROSTER.slice(0,10).map((p,i)=>(
        <Tr key={p.id} cols="2fr 2fr 1fr 1fr 1fr 90px" last={i===9}>
          <div style={{fontWeight:700, fontSize:14}}>{p.name}</div>
          <div className="mono" style={{fontSize:12.5}}>{p.email}</div>
          <div style={{display:'flex', alignItems:'center', gap:6, fontSize:13}}><SkillDots level={p.skill}/> {p.skill}</div>
          <div className="mono" style={{fontSize:13, fontWeight:700}}>{Math.floor(Math.random()*30)+5}</div>
          <div><span className="chip gold">ACTIVE</span></div>
          <div style={{textAlign:'right'}}><button className="btn xs ghost"><Icon name="eye" size={12}/> View</button></div>
        </Tr>
      ))}
    </div>
  );
}

function VenuesTable(){
  return (
    <div className="card" style={{padding:0, overflow:'hidden'}}>
      <Th cols="2fr 1.2fr 2fr 1fr 90px"><div>Venue</div><div>Area</div><div>Address</div><div>Bookings</div><div></div></Th>
      {VENUES.map((v,i)=>(
        <Tr key={v.id} cols="2fr 1.2fr 2fr 1fr 90px" last={i===VENUES.length-1}>
          <div style={{fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:6}}><Icon name="map-pin" size={13} color="var(--ink-3)"/>{v.name}</div>
          <div style={{fontSize:13}}>{v.area}</div>
          <div className="mono" style={{fontSize:12.5}}>{v.addr}</div>
          <div className="mono" style={{fontSize:13, fontWeight:700}}>{Math.floor(Math.random()*20)+3}</div>
          <div style={{textAlign:'right'}}><button className="btn xs ghost"><Icon name="pencil" size={12}/> Edit</button></div>
        </Tr>
      ))}
    </div>
  );
}

function Reports(){
  const reports = [
    {who:'Sam O.', by:'Devon W.', what:'No-show, Friday Late Night', when:'5h ago', sev:'low'},
    {who:'Anonymous', by:'Aisha R.', what:'Disrespectful behavior, Tuesday Co-ed', when:'2d ago', sev:'med'},
  ];
  return (
    <div className="card" style={{padding:0, overflow:'hidden'}}>
      <Th cols="1.4fr 1.4fr 2fr 1fr 0.8fr 130px"><div>Reported</div><div>Reporter</div><div>Issue</div><div>When</div><div>Severity</div><div></div></Th>
      {reports.map((r,i)=>(
        <Tr key={i} cols="1.4fr 1.4fr 2fr 1fr 0.8fr 130px" last={i===reports.length-1}>
          <div style={{fontWeight:700, fontSize:14}}>{r.who}</div>
          <div style={{fontSize:13}}>{r.by}</div>
          <div style={{fontSize:13}}>{r.what}</div>
          <div className="mono" style={{fontSize:12, fontWeight:600}}>{r.when}</div>
          <div><span className="chip" style={{background: r.sev==='med'?'var(--warn)':'var(--accent)', color: r.sev==='med'?'var(--paper)':'var(--ink)', borderColor: r.sev==='med'?'var(--warn)':'var(--ink)'}}>{r.sev.toUpperCase()}</span></div>
          <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
            <button className="btn xs"><Icon name="check" size={12}/> Resolve</button>
            <button className="btn xs ghost"><Icon name="eye" size={12}/></button>
          </div>
        </Tr>
      ))}
    </div>
  );
}

function Th({cols, children}){
  return (
    <div className="mono admin-row" style={{display:'grid', gridTemplateColumns:cols, padding:'12px 18px', background:'var(--bg)', borderBottom:'2px solid var(--ink)', fontSize:10.5, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--ink-2)', gap:14}}>{children}</div>
  );
}
function Tr({cols, children, last}){
  return (
    <div className="admin-row" style={{display:'grid', gridTemplateColumns:cols, alignItems:'center', padding:'12px 18px', borderBottom: last?'none':'1px dashed var(--ink-3)', gap:14}}>{children}</div>
  );
}

window.Admin = Admin;
