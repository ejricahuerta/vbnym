// Browse → mobile-first, layered cards

function Browse({onNav, t}){
  const [tab, setTab] = React.useState('all');
  const [view, setView] = React.useState('grid');

  const events = React.useMemo(()=>{
    let list = ALL_EVENTS;
    if (tab!=='all') list = list.filter(e=>e.kind===tab);
    return list;
  }, [tab]);

  return (
    <div>
      <section style={{borderBottom:'2px solid var(--ink)', background:'var(--bg)', position:'relative', overflow:'hidden'}}>
        <div style={{maxWidth:1280, margin:'0 auto', padding:'36px 18px 28px', position:'relative'}}>
          <div className="label" style={{marginBottom:10}}>Browse · 38 results</div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:14, marginBottom:24}}>
            <h1 className="display" style={{fontSize:'clamp(44px, 9vw, 96px)', margin:0, letterSpacing:'-.04em'}}>What's on<br/><span className="serif-display" style={{fontStyle:'italic', textTransform:'lowercase'}}>this week.</span></h1>
            <div style={{display:'flex', gap:6}}>
              <button onClick={()=>setView('grid')} className={view==='grid'?'btn sm accent':'btn sm ghost'}><Icon name="layout-grid" size={14}/> Grid</button>
              <button onClick={()=>setView('list')} className={view==='list'?'btn sm accent':'btn sm ghost'}><Icon name="list" size={14}/> List</button>
            </div>
          </div>
          <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:14}}>
            {[
              {id:'all', label:'All', n: ALL_EVENTS.length},
              {id:'dropin', label:'Drop-ins', n: DROPINS.length},
              {id:'league', label:'Leagues', n: LEAGUES.length},
              {id:'tournament', label:'Tournaments', n: TOURNAMENTS.length},
            ].map(x => (
              <button key={x.id} onClick={()=>setTab(x.id)} className="focusable"
                style={{
                  appearance:'none', cursor:'pointer', fontFamily:'var(--ui)', fontWeight:700, fontSize:13,
                  padding:'9px 14px', borderRadius:6, border:'2px solid var(--ink)',
                  background: tab===x.id?'var(--ink)':'transparent', color: tab===x.id?'var(--paper)':'var(--ink)',
                  display:'inline-flex', alignItems:'center', gap:8, textTransform:'uppercase', letterSpacing:'.04em',
                  boxShadow: tab===x.id?'2px 2px 0 var(--accent)':'2px 2px 0 var(--ink)'
                }}>
                {x.label} <span style={{opacity:.6, fontWeight:500}}>{x.n}</span>
              </button>
            ))}
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
            <Select defaultValue="any">
              <SelectTrigger style={{width:'auto', minWidth:140, height:38}}><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any day</SelectItem>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger style={{width:'auto', minWidth:180, height:38}}><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All neighbourhoods</SelectItem>
                {[...new Set(VENUES.map(v=>v.area))].map(a=><SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <span style={{marginLeft:'auto', fontSize:12, color:'var(--ink-2)'}} className="mono">{events.length} found</span>
          </div>
        </div>
      </section>

      <section style={{maxWidth:1280, margin:'0 auto', padding:'28px 18px 60px'}}>
        {view==='grid' ? (
          <div className="grid grid-3" style={{gridTemplateColumns:'repeat(3,1fr)', gap:14}}>
            {events.map(e => {
              if (e.kind==='dropin') return <GameCard key={e.id} game={e} onClick={()=>onNav('detail', e.id)} dense={t.density==='compact'}/>;
              if (e.kind==='league') return <LeagueCard key={e.id} league={e} onClick={()=>onNav('detail', e.id)} dense={t.density==='compact'}/>;
              if (e.kind==='tournament') return <TournamentCard key={e.id} t={e} onClick={()=>onNav('detail', e.id)} dense={t.density==='compact'}/>;
              return null;
            })}
          </div>
        ) : (
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            {events.map((e,i)=>(
              <ListRow key={e.id} e={e} onClick={()=>onNav('detail', e.id)} last={i===events.length-1}/>
            ))}
          </div>
        )}
      </section>

      <Footer/>
    </div>
  );
}

function GameCard({game, onClick, dense}){
  const full = game.signed >= game.capacity;
  const almost = !full && (game.capacity - game.signed) <= 4;
  return (
    <button onClick={onClick} className="focusable liftable" style={{textAlign:'left', appearance:'none', border:0, padding:0, background:'transparent', cursor:'pointer'}}>
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div style={{background:'var(--accent)', borderBottom:'2px solid var(--ink)', padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <KindBadge kind="dropin"/>
          {full ? <span className="chip">WAIT-LIST</span>
            : almost ? <span className="chip warn">{game.capacity - game.signed} LEFT</span>
            : game.tag ? <span className="chip outline">{game.tag}</span> : <span className="mono" style={{fontSize:10,letterSpacing:'.12em',fontWeight:700}}>OPEN</span>}
        </div>
        <div style={{padding: dense ? 14 : 18, display:'flex', gap:14, alignItems:'flex-start'}}>
          <DayStamp iso={game.start} size="md"/>
          <div style={{flex:1, minWidth:0}}>
            <h3 className="display" style={{fontSize:dense?17:21, margin:'0 0 6px', letterSpacing:'-.02em'}}>{game.title}</h3>
            <div style={{fontSize:12.5, color:'var(--ink-2)', marginBottom:6, lineHeight:1.5}}><div style={{display:'flex', alignItems:'center', gap:5}}><Icon name="map-pin" size={12}/>{game.venue.name} → {game.venue.area}</div><div style={{display:'flex', alignItems:'center', gap:5}}><Icon name="clock" size={12}/>{formatRange(game.start, game.durationMin)}</div></div>
            <div style={{display:'flex', alignItems:'center', gap:8, fontSize:11.5, color:'var(--ink-2)'}}>
              <SkillDots level={game.skill}/> <span className="mono" style={{letterSpacing:'.08em', textTransform:'uppercase', fontWeight:600}}>{game.skill}</span>
            </div>
          </div>
        </div>
        <div style={{borderTop:'2px dashed var(--ink)', padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg)'}}>
          <div className="mono" style={{fontSize:11, fontWeight:700, letterSpacing:'.08em'}}>{game.signed}/{game.capacity} SIGNED</div>
          <div style={{display:'flex', alignItems:'baseline', gap:6}}>
            <span className="display" style={{fontSize:20}}>${game.price}</span>
            <span className="mono" style={{fontSize:9, color:'var(--ink-3)', letterSpacing:'.14em', fontWeight:700}}>INTERAC</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function LeagueCard({league, onClick, dense}){
  return (
    <button onClick={onClick} className="focusable liftable" style={{textAlign:'left', appearance:'none', border:0, padding:0, background:'transparent', cursor:'pointer'}}>
      <div className="card dark" style={{padding:0, overflow:'hidden', position:'relative'}}>
        <div style={{padding:'10px 14px', borderBottom:'2px solid var(--paper)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <KindBadge kind="league" invert/>
          <span className="chip outline" style={{borderColor:'var(--paper)', color:'var(--paper)'}}>{league.nights} WEEKS</span>
        </div>
        <div style={{padding: dense?14:20}}>
          <h3 className="display" style={{fontSize:dense?20:24, margin:'0 0 12px', color:'var(--accent)', lineHeight:.95, letterSpacing:'-.02em'}}>{league.title}</h3>
          <div style={{fontSize:13, color:'rgba(251,248,241,.7)', marginBottom:14}}>{league.venue.name} → Starts {formatDay(league.startDate)}</div>
          <div style={{display:'flex', alignItems:'center', gap:8, fontSize:12, color:'rgba(251,248,241,.85)', marginBottom:18}}>
            <SkillDots level={league.skill}/> <span className="mono" style={{letterSpacing:'.08em',textTransform:'uppercase',fontWeight:600}}>{league.skill}</span>
          </div>
          <div style={{borderTop:'2px dashed rgba(251,248,241,.3)', paddingTop:14, display:'flex', justifyContent:'space-between'}}>
            <div>
              <div className="mono" style={{fontSize:9, color:'rgba(251,248,241,.5)', letterSpacing:'.14em', fontWeight:700}}>TEAMS</div>
              <div className="display" style={{fontSize:22, color:'var(--paper)'}}>{league.teamsIn}/{league.teamCap}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div className="mono" style={{fontSize:9, color:'rgba(251,248,241,.5)', letterSpacing:'.14em', fontWeight:700}}>PER TEAM</div>
              <div className="display" style={{fontSize:22, color:'var(--accent)'}}>${league.pricePerTeam}</div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function TournamentCard({t, onClick, dense}){
  const d = dayBig(t.date);
  return (
    <button onClick={onClick} className="focusable liftable" style={{textAlign:'left', appearance:'none', border:0, padding:0, background:'transparent', cursor:'pointer'}}>
      <div className="card" style={{padding:0, overflow:'hidden', background:'var(--paper)'}}>
        <div style={{padding:'10px 14px', borderBottom:'2px solid var(--ink)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg)'}}>
          <KindBadge kind="tournament"/>
          <span className="chip gold">PRIZE: {t.prize.split('+')[0].trim()}</span>
        </div>
        <div style={{padding: dense?14:20, position:'relative', overflow:'hidden'}}>
          <div style={{display:'flex', alignItems:'baseline', gap:14, marginBottom:10}}>
            <div className="display" style={{fontSize:dense?54:72, lineHeight:.85, letterSpacing:'-.04em'}}>{d.num}</div>
            <div>
              <div className="mono" style={{fontSize:10, letterSpacing:'.14em', fontWeight:700}}>{d.dow} · {d.mon}</div>
              <div className="mono" style={{fontSize:10, letterSpacing:'.14em', color:'var(--ink-3)', fontWeight:700}}>{formatTime(t.date)}</div>
            </div>
          </div>
          <h3 className="display" style={{fontSize:dense?20:24, margin:'0 0 8px', letterSpacing:'-.02em'}}>{t.title}</h3>
          <div style={{fontSize:13, color:'var(--ink-2)', marginBottom:14}}>{t.venue.name} · {t.format}</div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'2px dashed var(--ink)', paddingTop:12}}>
            <div className="mono" style={{fontSize:11, fontWeight:700, letterSpacing:'.08em'}}>{t.teamsIn}/{t.teamCap} TEAMS</div>
            <span className="display" style={{fontSize:20}}>${t.pricePerTeam}/team</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ListRow({e, onClick, last}){
  const isLeague = e.kind==='league';
  const isTour = e.kind==='tournament';
  const iso = e.start || e.startDate || e.date;
  const subtitle = isLeague ? `${e.nights} weeks · ${e.format}` : isTour ? e.format : formatRange(e.start, e.durationMin);
  const cap = isLeague || isTour ? `${e.teamsIn}/${e.teamCap} teams` : `${e.signed}/${e.capacity}`;
  const price = isLeague ? `$${e.pricePerTeam}/team` : isTour ? `$${e.pricePerTeam}/team` : `$${e.price}`;
  return (
    <button onClick={onClick} className="focusable" style={{appearance:'none',border:0,background:'transparent',cursor:'pointer',padding:0,textAlign:'left',width:'100%'}}>
      <div style={{display:'grid', gridTemplateColumns:'80px 1.6fr 1.2fr 0.8fr 0.6fr 0.6fr', gap:14, alignItems:'center', padding:'14px 18px', borderBottom: last?'none':'1px dashed var(--ink-3)'}}>
        <DayStamp iso={iso} size="sm"/>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8, marginBottom:4, flexWrap:'wrap'}}>
            <KindBadge kind={e.kind}/>
            <h4 style={{margin:0, fontSize:15, fontWeight:800}}>{e.title}</h4>
          </div>
          <div style={{fontSize:12.5, color:'var(--ink-2)'}}>{subtitle}</div>
        </div>
        <div style={{fontSize:13}}>{e.venue.name}<br/><span style={{color:'var(--ink-3)'}}>{e.venue.area}</span></div>
        <div style={{display:'flex',alignItems:'center',gap:6, fontSize:12.5}}><SkillDots level={e.skill}/></div>
        <div className="mono" style={{fontSize:12.5, fontWeight:700}}>{cap}</div>
        <div style={{textAlign:'right'}}>
          <div className="display" style={{fontSize:18}}>{price}</div>
        </div>
      </div>
    </button>
  );
}

Object.assign(window, { Browse, GameCard, LeagueCard, TournamentCard, ListRow });
