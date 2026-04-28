// Host: create a game/league/tournament

function Host({onNav}){
  const [kind, setKind] = React.useState('dropin');
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    title:'', venue:'v1', date:'', time:'19:00', duration:120, weeks:8,
    skill:'Intermediate', capacity: 18, price: 15, format:'Co-ed 6s',
    hostEmail:'', hostName:'', notes:''
  });
  const upd = (k,v)=>setForm(f=>({...f, [k]:v}));

  return (
    <div>
      <section style={{borderBottom:'2px solid var(--ink)'}}>
        <div style={{maxWidth:1280, margin:'0 auto', padding:'40px 18px'}}>
          <div className="label" style={{marginBottom:10}}>For hosts</div>
          <h1 className="display" style={{fontSize:'clamp(44px, 8vw, 96px)', margin:'0 0 12px', letterSpacing:'-.04em'}}>Post your <span className="serif-display" style={{fontStyle:'italic', textTransform:'lowercase'}}>night.</span></h1>
          <p style={{maxWidth:560, fontSize:16, color:'var(--ink-2)', margin:0}}>Three quick steps. Your post goes live the moment you publish → players can sign up immediately.</p>
        </div>
      </section>

      <section style={{maxWidth:1280, margin:'0 auto', padding:'32px 18px'}}>
        <div className="grid grid-2" style={{gridTemplateColumns: step===1 ? '1fr' : '1fr 1fr', gap:36}}>
          <div>
            <div style={{display:'flex', gap:6, marginBottom:24, flexWrap:'wrap'}}>
              {[['1. Type','tag'],['2. Details','file-text'],['3. Payment','wallet']].map(([s,ic],i)=>(
                <div key={i} onClick={()=>setStep(i+1)} style={{
                  cursor:'pointer', fontSize:12, fontWeight:700, padding:'7px 12px', borderRadius:6, letterSpacing:'.04em',
                  border:'2px solid var(--ink)',
                  background: step===i+1?'var(--accent)':'transparent', color:'var(--ink)',
                  textTransform:'uppercase', display:'inline-flex', alignItems:'center', gap:6,
                  boxShadow: step===i+1?'2px 2px 0 var(--ink)':'none'
                }}><Icon name={ic} size={12}/>{s}</div>
              ))}
            </div>

            {step===1 && (
              <div>
                <div className="label">What are you running?</div>
                <div style={{display:'grid', gap:14, gridTemplateColumns:'1fr 1fr 1fr'}} className="grid grid-3">
                  {[
                    {id:'dropin', t:'Drop-in', d:'Single session, individual sign-ups.', ic:'zap', stat:'Most common', meta:['Per-player price','Wait-list auto-fills','Auto-match Interac codes']},
                    {id:'league', t:'League', d:'Multi-week season with team standings.', ic:'trophy', stat:'Recurring revenue', meta:['Per-team price','Standings + playoffs','Captain manages roster']},
                    {id:'tournament', t:'Tournament', d:'Single-day pool play into bracket.', ic:'medal', stat:'Big payouts', meta:['Per-team price','Pool → bracket','Prize splits supported']},
                  ].map(o=>{
                    const active = kind===o.id;
                    return (
                      <button key={o.id} type="button" onClick={()=>setKind(o.id)}
                        style={{
                          appearance:'none', cursor:'pointer', textAlign:'left',
                          background: active ? 'var(--ink)' : 'var(--paper)',
                          color: active ? 'var(--paper)' : 'var(--ink)',
                          border:'2px solid var(--ink)', borderRadius:10, padding:0,
                          fontFamily:'var(--ui)', overflow:'hidden',
                          boxShadow: active ? '5px 5px 0 var(--accent)' : '3px 3px 0 var(--ink)',
                          transform: active ? 'translate(-2px,-2px)' : 'none',
                          transition:'transform .15s ease, box-shadow .15s ease, background .15s ease',
                          display:'flex', flexDirection:'column'
                        }}>
                        {/* Header bar with kind badge + index */}
                        <div style={{
                          display:'flex', justifyContent:'space-between', alignItems:'center',
                          padding:'10px 14px',
                          borderBottom: `2px solid ${active?'var(--paper)':'var(--ink)'}`,
                          background: active ? 'var(--ink)' : (o.id==='dropin'?'var(--accent)':o.id==='league'?'var(--paper)':'var(--bg)')
                        }}>
                          <span className="mono" style={{fontSize:10, letterSpacing:'.16em', fontWeight:700}}>
                            FORMAT · 0{o.id==='dropin'?1:o.id==='league'?2:3}
                          </span>
                          <span className="mono" style={{fontSize:10, letterSpacing:'.14em', fontWeight:700, opacity:.72}}>
                            {o.stat.toUpperCase()}
                          </span>
                        </div>

                        {/* Body */}
                        <div style={{padding:'22px 18px 18px', flex:1, display:'flex', flexDirection:'column', gap:6}}>
                          <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12}}>
                            <h3 className="display" style={{fontSize:34, margin:0, letterSpacing:'-.03em', lineHeight:.95}}>
                              {o.t}
                            </h3>
                            <div style={{
                              width:48, height:48, borderRadius:'50%',
                              border:`2px solid ${active?'var(--paper)':'var(--ink)'}`,
                              background: active ? 'var(--accent)' : 'var(--paper)',
                              color:'var(--ink)',
                              display:'grid', placeItems:'center', flex:'0 0 auto'
                            }}>
                              <Icon name={o.ic} size={22} strokeWidth={2.2}/>
                            </div>
                          </div>
                          <p style={{margin:'4px 0 12px', fontSize:13.5, lineHeight:1.5, color: active?'rgba(251,248,241,.78)':'var(--ink-2)'}}>{o.d}</p>

                          <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:6, borderTop:`1px dashed ${active?'rgba(251,248,241,.3)':'var(--ink-3)'}`, paddingTop:12}}>
                            {o.meta.map((m,i)=>(
                              <li key={i} style={{display:'flex', alignItems:'center', gap:8, fontSize:12.5, fontFamily:'var(--ui)'}}>
                                <Icon name={active?'check':'check'} size={13} strokeWidth={2.5} style={{color: active?'var(--accent)':'var(--ok)', flex:'0 0 auto'}}/>
                                <span style={{color: active?'rgba(251,248,241,.85)':'var(--ink)'}}>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Footer indicator */}
                        <div style={{
                          padding:'10px 14px',
                          background: active ? 'var(--accent)' : (active?'var(--bg)':'transparent'),
                          borderTop: active ? '2px solid var(--paper)' : '1px solid var(--ink-3)',
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          color: active ? 'var(--ink)' : 'var(--ink-3)'
                        }}>
                          <span className="mono" style={{fontSize:10, letterSpacing:'.16em', fontWeight:700}}>
                            {active ? 'SELECTED' : 'TAP TO PICK'}
                          </span>
                          <Icon name={active?'check-circle-2':'arrow-right'} size={15} strokeWidth={2.4}/>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{marginTop:24, display:'flex', gap:10}}>
                  <button onClick={()=>setStep(2)} className="btn">Continue <Icon name="arrow-right" size={16}/></button>
                </div>
              </div>
            )}

            {step===2 && (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <label className="label">Title</label>
                  <input className="input" value={form.title} onChange={e=>upd('title', e.target.value)} placeholder={kind==='dropin'?'Tuesday Co-ed 6s':kind==='league'?'Spring Co-ed 6s → Tuesday A':'6ix Back Spring Open'}/>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div>
                    <label className="label">Venue</label>
                    <Select value={form.venue} onValueChange={v=>upd('venue', v)}>
                      <SelectTrigger><SelectValue placeholder="Choose a venue"/></SelectTrigger>
                      <SelectContent>
                        {VENUES.map(v=><SelectItem key={v.id} value={v.id}>{v.name} → {v.area}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="label">Skill level</label>
                    <Select value={form.skill} onValueChange={v=>upd('skill', v)}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        {SKILLS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
                  <div>
                    <label className="label">{kind==='league'?'First night':'Date'}</label>
                    <input className="input" type="date" value={form.date} onChange={e=>upd('date', e.target.value)}/>
                  </div>
                  <div>
                    <label className="label">Start time</label>
                    <input className="input" type="time" value={form.time} onChange={e=>upd('time', e.target.value)}/>
                  </div>
                  <div>
                    <label className="label">{kind==='league'?'# weeks':'Duration (min)'}</label>
                    <input className="input" type="number" value={kind==='league'?form.weeks:form.duration} onChange={e=>upd(kind==='league'?'weeks':'duration', +e.target.value)}/>
                  </div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div>
                    <label className="label">{kind==='dropin'?'Player cap':'Team cap'}</label>
                    <input className="input" type="number" value={form.capacity} onChange={e=>upd('capacity', +e.target.value)}/>
                  </div>
                  <div>
                    <label className="label">Price (CAD)</label>
                    <input className="input" type="number" value={form.price} onChange={e=>upd('price', +e.target.value)}/>
                  </div>
                </div>
                <div>
                  <label className="label">Format / notes for players</label>
                  <input className="input" value={form.format} onChange={e=>upd('format', e.target.value)} placeholder="Co-ed 6s → 3 courts, refs on"/>
                </div>
                <div style={{display:'flex', gap:10, marginTop:8}}>
                  <button onClick={()=>setStep(1)} className="btn ghost"><Icon name="arrow-left" size={14}/> Back</button>
                  <button onClick={()=>setStep(3)} className="btn">Continue to payment <Icon name="arrow-right" size={16}/></button>
                </div>
              </div>
            )}

            {step===3 && (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="card" style={{background:'var(--accent)', borderColor:'var(--ink)'}}>
                  <div style={{display:'flex', gap:14, alignItems:'flex-start'}}>
                    <Icon name="banknote" size={32} strokeWidth={2}/>
                    <div>
                      <div className="display" style={{fontSize:22, marginBottom:6, letterSpacing:'-.02em'}}>Interac e-Transfer only</div>
                      <p style={{margin:0, fontSize:13.5, lineHeight:1.5, color:'var(--ink)'}}>
                        We don't process card payments. Players will send funds directly to your email below → zero fees, zero middleman. We just track who's paid.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">Your name (shown to players)</label>
                  <input className="input" value={form.hostName} onChange={e=>upd('hostName', e.target.value)} placeholder="Marcus K."/>
                </div>
                <div>
                  <label className="label">Interac e-Transfer email</label>
                  <input className="input" value={form.hostEmail} onChange={e=>upd('hostEmail', e.target.value)} placeholder="you@example.com" type="email"/>
                  <div className="mono" style={{fontSize:11, color:'var(--ink-3)', marginTop:6, fontWeight:600, letterSpacing:'.04em'}}>This is what players will send money to. Make sure auto-deposit is on so you don't have to answer security questions.</div>
                </div>
                <label style={{display:'flex', alignItems:'flex-start', gap:10, fontSize:13, color:'var(--ink-2)', cursor:'pointer'}}>
                  <Checkbox defaultChecked/>
                  <span>I confirm Interac auto-deposit is enabled on this email so the system can auto-match payments by reference code.</span>
                </label>
                <div style={{display:'flex', gap:10, marginTop:8}}>
                  <button onClick={()=>setStep(2)} className="btn ghost"><Icon name="arrow-left" size={14}/> Back</button>
                  <button onClick={()=>onNav('roster')} className="btn accent" disabled={!form.hostEmail||!form.hostName}
                    style={{opacity:(!form.hostEmail||!form.hostName)?.4:1}}>
                    Publish post <Icon name="arrow-right" size={16}/>
                  </button>
                </div>
              </div>
            )}
          </div>

          {step!==1 && <div>
            <div className="label" style={{marginBottom:10}}>Live preview</div>
            <PreviewCard kind={kind} form={form}/>

            <div style={{marginTop:24}}>
              <div className="label" style={{marginBottom:10}}>What happens next</div>
              <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:10}}>
                {[
                  ['megaphone','Post goes live in browse'],
                  ['user-plus','Players sign up + see your Interac email'],
                  ['banknote','You get paid directly via e-Transfer'],
                  ['check-circle-2','Reference codes auto-match → spots flip to PAID within a minute'],
                ].map(([ic,t])=>(
                  <li key={t} style={{display:'flex',gap:12, alignItems:'center', fontSize:14}}>
                    <span style={{width:36, height:36, borderRadius:6, background:'var(--accent)', border:'2px solid var(--ink)', display:'inline-grid', placeItems:'center', flexShrink:0}}><Icon name={ic} size={18}/></span> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>}
        </div>
      </section>
      <Footer/>
    </div>
  );
}

function PreviewCard({kind, form}){
  const venue = VENUES.find(v=>v.id===form.venue) || VENUES[0];
  const title = form.title || (kind==='dropin'?'Your drop-in title':kind==='league'?'Your league title':'Your tournament title');
  const dark = kind==='league';
  return (
    <div className="card" style={{padding:0, overflow:'hidden', background: dark?'var(--ink)':'var(--paper)', color: dark?'var(--paper)':'var(--ink)', borderColor:'var(--ink)'}}>
      <div style={{background: kind==='dropin'?'var(--accent)':dark?'transparent':'var(--bg)', borderBottom:'2px solid '+(dark?'var(--paper)':'var(--ink)'), padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <KindBadge kind={kind} invert={dark}/>
        <span className="chip outline" style={dark?{color:'var(--paper)', borderColor:'var(--paper)'}:{}}>{form.skill}</span>
      </div>
      <div style={{padding:20}}>
        <h3 className="display" style={{fontSize:24, margin:'0 0 8px', color: dark?'var(--accent)':'var(--ink)', letterSpacing:'-.02em'}}>{title}</h3>
        <div style={{fontSize:13, opacity:.8, marginBottom:14, display:'flex', alignItems:'center', gap:6}}><Icon name="map-pin" size={12}/>{venue.name} · {venue.area}</div>
        <div style={{display:'flex', justifyContent:'space-between', borderTop:'2px dashed '+(dark?'rgba(251,248,241,.3)':'var(--ink)'), paddingTop:12}}>
          <div>
            <div className="mono" style={{fontSize:10, opacity:.6, letterSpacing:'.12em', fontWeight:700}}>SPOTS</div>
            <div className="display" style={{fontSize:22, letterSpacing:'-.03em'}}>{form.capacity}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div className="mono" style={{fontSize:10, opacity:.6, letterSpacing:'.12em', fontWeight:700}}>{kind==='dropin'?'PER PLAYER':'PER TEAM'}</div>
            <div className="display" style={{fontSize:22, color: dark?'var(--accent)':'var(--ink)', letterSpacing:'-.03em'}}>${form.price}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Host = Host;
