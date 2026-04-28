// Main app shell → routing + tweaks panel

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "orange",
  "type": "archivo",
  "density": "regular",
  "hero": "ticket"
}/*EDITMODE-END*/;

function App(){
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [page, setPage] = React.useState('landing');
  const [eventId, setEventId] = React.useState(null);
  const [signedUpEvents, setSignedUpEvents] = React.useState({});

  // Apply tweaks to body data attrs
  React.useEffect(()=>{
    document.body.dataset.pal = t.palette;
    document.body.dataset.type = t.type;
    document.body.dataset.density = t.density;
  }, [t.palette, t.type, t.density]);

  const nav = (p, id) => {
    setPage(p);
    if (id !== undefined) setEventId(id);
    window.scrollTo({top:0});
  };

  return (
    <div style={{minHeight:'100vh', display:'flex', flexDirection:'column'}}>
      {page !== 'landing' && <Header page={page} onNav={nav}/>}
      <main style={{flex:1}} data-screen-label={page === 'landing' ? '01 Landing' : page === 'browse' ? '02 Browse' : page === 'detail' ? '03 Detail' : page === 'host' ? '04 Host' : page === 'roster' ? '05 Roster' : '06 Admin'}>
        {page === 'landing' && (
          <>
            <HeaderLanding onNav={nav}/>
            <Landing onNav={nav} t={t} setTweak={setTweak}/>
          </>
        )}
        {page === 'browse' && <Browse onNav={nav} t={t}/>}
        {page === 'detail' && <Detail eventId={eventId} onNav={nav} signedUp={!!signedUpEvents[eventId]} onSignup={(id, val)=>setSignedUpEvents(s=>({...s, [id]:val!==false}))}/>}
        {page === 'host' && <Host onNav={nav}/>}
        {page === 'roster' && <Roster onNav={nav}/>}
        {page === 'admin' && <Admin onNav={nav}/>}
      </main>

      <TweaksPanel>
        <TweakSection label="Brand"/>
        <TweakRadio label="Palette" value={t.palette} options={['yellow','orange','blue','red']} onChange={v=>setTweak('palette', v)}/>
        <TweakSelect label="Typography" value={t.type} options={['archivo','bricolage','anton','bebas']} onChange={v=>setTweak('type', v)}/>
        <TweakSection label="Layout"/>
        <TweakRadio label="Density" value={t.density} options={['compact','regular','comfy']} onChange={v=>setTweak('density', v)}/>
        <TweakSelect label="Landing hero" value={t.hero} options={['court','ticket','editorial']} onChange={v=>setTweak('hero', v)}/>
        <TweakSection label="Jump to"/>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
          {[['landing','Landing'],['browse','Browse'],['detail','Detail'],['host','Host'],['roster','Roster'],['admin','Admin']].map(([id,l])=>(
            <button key={id} onClick={()=>nav(id, id==='detail'?'d1':undefined)}
              style={{appearance:'none', cursor:'pointer', fontFamily:'var(--ui)', fontWeight:600, fontSize:11, padding:'7px 10px', borderRadius:7, border:'1px solid rgba(0,0,0,.15)', background: page===id?'var(--accent)':'#fff', color:'var(--ink)'}}>{l}</button>
          ))}
        </div>
      </TweaksPanel>
      <Toaster/>
    </div>
  );
}

// Landing has its own dark transparent header
function HeaderLanding({onNav}){
  return <Header page="landing" onNav={onNav}/>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
