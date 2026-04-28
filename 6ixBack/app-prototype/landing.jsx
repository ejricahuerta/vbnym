// Landing page → mobile-first, layered, committed identity

function Landing({ onNav, t, setTweak }) {
  return (
    <div>
      {t.hero === 'court' && <HeroCourt onNav={onNav} />}
      {t.hero === 'ticket' && <HeroTicket onNav={onNav} />}
      {t.hero === 'editorial' && <HeroEditorial onNav={onNav} />}

      <Marquee />

      <HowItWorks />

      <FormatGrid onNav={onNav} />

      <ThisWeek onNav={onNav} t={t} />

      <HostCTA onNav={onNav} />

      <Stats />

      <SupportBlock />

      <Footer />
    </div>);

}

function Marquee() {
  return (
    <div style={{ borderTop: '2px solid var(--ink)', borderBottom: '2px solid var(--ink)', background: 'var(--accent)', overflow: 'hidden', padding: '12px 0' }}>
      <div className="marquee-track" style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 'clamp(20px, 3vw, 30px)', letterSpacing: '-.01em' }}>
        {[...Array(2)].map((_, k) =>
        <React.Fragment key={k}>
            <span>★ DROP-INS ALL WEEK</span>
            <span>★ INTERAC ONLY</span>
            <span>★ NO CARD FEES</span>
            <span>★ CO-ED 6S</span>
          </React.Fragment>
        )}
      </div>
    </div>);

}

function HeroCourt({ onNav }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '2px solid var(--ink)' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: .5, pointerEvents: 'none' }}>
        <CourtSVG stroke="var(--ink)" strokeOpacity={.3} style={{ position: 'absolute', right: '-15%', top: '8%', width: '95%', height: '90%' }} />
      </div>
      {/* Big number "06" → jersey number */}
      <div className="hide-mobile" style={{ position: 'absolute', right: '-3%', top: '-4%', fontFamily: 'var(--display)', fontWeight: 900, fontSize: 'min(48vw, 720px)', lineHeight: .78, letterSpacing: '-.06em', color: 'var(--accent)', WebkitTextStroke: '2px var(--ink)', pointerEvents: 'none', userSelect: 'none', zIndex: 1 }}>
        06
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 18px 56px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span className="pill solid live">LIVE → 38 GAMES THIS WEEK</span>
        </div>
        <h1 className="display" style={{ fontSize: 'clamp(56px, 12vw, 168px)', margin: '0 0 20px', maxWidth: 1100, letterSpacing: '-.04em' }}>
          Toronto's<br />volleyball<br /><span className="scribble" style={{ transform: 'rotate(-2deg)', display: 'inline-block' }}>switchboard.</span>
        </h1>
        <p style={{ maxWidth: 560, fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.55, color: 'var(--ink-2)', margin: '0 0 28px' }}>
          Drop-ins, leagues, and tournaments across the GTA. Sign up in three taps. Pay your host by Interac. Show up and play.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => onNav('browse')} className="btn lg accent">Find a game tonight <Icon name="arrow-right" size={18} /></button>
          <button onClick={() => onNav('host')} className="btn lg ghost"><Icon name="plus" size={18} /> Host a game</button>
        </div>

        {/* Stat strip */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, paddingTop: 24, borderTop: '2px solid var(--ink)' }} className="grid grid-4">
          {[
          { n: '1.8K+', l: 'Players' },
          { n: '38', l: 'This week' },
          { n: '14', l: 'Leagues' },
          { n: '$0', l: 'Fees' }].
          map((s, i) =>
          <div key={i}>
              <div className="display" style={{ fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: .9 }}>{s.n}</div>
              <div className="eyebrow" style={{ marginTop: 6 }}>{s.l}</div>
            </div>
          )}
        </div>
      </div>
    </section>);

}

function HeroTicket({ onNav }) {
  return (
    <section style={{ background: 'var(--ink)', color: 'var(--paper)', borderBottom: '2px solid var(--ink)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: .06, pointerEvents: 'none' }}>
        <CourtSVG stroke="var(--paper)" strokeOpacity={1} style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 18px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'center', position: 'relative' }} className="grid grid-2">
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            <span className="pill solid live">TONIGHT</span>
            <span className="pill" style={{ background: 'transparent', color: 'var(--paper)', borderColor: 'var(--paper)' }}>CO-ED 6S</span>
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(56px, 12vw, 144px)', margin: '0 0 16px', lineHeight: .85, letterSpacing: '-.04em' }}>
            Get on<br />the <span style={{ color: 'var(--accent)' }}>court.</span>
          </h1>
          <p style={{ maxWidth: 520, fontSize: 'clamp(15px, 2vw, 18px)', color: 'rgba(251,248,241,.75)', lineHeight: 1.5, margin: '0 0 24px' }}>
            38 drop-ins, 14 leagues, 2 tournaments. All Interac. All Toronto. Tap in.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => onNav('browse')} className="btn lg accent">Browse schedule <Icon name="arrow-right" size={18} /></button>
            <button onClick={() => onNav('host')} className="btn lg invert"><Icon name="plus" size={18} /> Host a game</button>
          </div>
        </div>
        <div><TicketCard /></div>
      </div>
    </section>);

}

function HeroEditorial({ onNav }) {
  return (
    <section style={{ borderBottom: '2px solid var(--ink)', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid var(--ink)', flexWrap: 'wrap' }} className="mono">
          <span style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 600 }}>VOL. 04 · SPRING ISSUE · 2026</span>
          <span style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 600 }}>TKARONTO, CANADA</span>
        </div>
        <h1 className="display" style={{ fontSize: 'clamp(72px, 17vw, 280px)', margin: '0 0 16px', lineHeight: .78, letterSpacing: '-.05em' }}>
          6IX&nbsp;BACK
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, paddingTop: 20, borderTop: '2px solid var(--ink)' }} className="grid grid-2">
          <div>
            <p className="serif-display" style={{ fontSize: 'clamp(28px, 4.5vw, 56px)', lineHeight: 1.05, margin: '0 0 24px', maxWidth: 760, letterSpacing: '-.02em' }}>
              The city's volleyball, on one schedule. <span className="scribble" style={{ fontStyle: 'italic' }}>No card fees, no nonsense</span> → Interac to your host.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => onNav('browse')} className="btn lg">Find a game <Icon name="arrow-right" size={18} /></button>
              <button onClick={() => onNav('host')} className="btn lg ghost"><Icon name="plus" size={18} /> Host a game</button>
            </div>
          </div>
          <div>
            <div className="label">Inside this week</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14, color: 'var(--ink-2)' }}>
              {[['Tuesday Co-ed 6s', 'p.04'], ['Spring Open Tournament', 'p.07'], ['Beginner Clinic → Sundays', 'p.11'], ['Host playbook', 'p.14']].map(([a, b], i) =>
              <li key={i} style={{ padding: '12px 0', borderBottom: i === 3 ? 'none' : '1px dashed var(--ink-3)', display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ fontWeight: 600, color: 'var(--ink)' }}>{a}</span><span className="mono" style={{ fontSize: 11, letterSpacing: '.12em' }}>{b}</span></li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>);

}

function TicketCard() {
  const g = DROPINS[0];
  return (
    <div style={{ background: 'var(--paper)', color: 'var(--ink)', borderRadius: 10, position: 'relative', boxShadow: '8px 8px 0 var(--accent), 12px 12px 0 var(--paper), 16px 16px 0 0 rgba(0,0,0,.4)', transform: 'rotate(-1.5deg)', border: '2px solid var(--ink)' }}>
      <div style={{ position: 'absolute', left: -9, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', background: 'var(--ink)', border: '2px solid var(--ink)' }} />
      <div style={{ position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', background: 'var(--ink)', border: '2px solid var(--ink)' }} />
      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <Logo size={13} />
        <span className="mono" style={{ fontSize: 10, letterSpacing: '.14em', fontWeight: 700 }}>NO. 0042 · CO-ED</span>
      </div>
      <div style={{ borderTop: '2px dashed var(--ink)', borderBottom: '2px dashed var(--ink)', padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
        <DayStamp iso={g.start} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="display" style={{ fontSize: 22, margin: '0 0 4px', letterSpacing: '-.02em' }}>{g.title}</h3>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="map-pin" size={12} />{g.venue.name}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', letterSpacing: '.06em', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={11} />{formatRange(g.start, g.durationMin)}</div>
        </div>
      </div>
      <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.14em', color: 'var(--ink-3)', fontWeight: 700 }}>SPOTS LEFT</div>
          <div className="display" style={{ fontSize: 24 }}>{g.capacity - g.signed}<span style={{ color: 'var(--ink-3)', fontSize: 14 }}>/{g.capacity}</span></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '.14em', color: 'var(--ink-3)', fontWeight: 700 }}>INTERAC</div>
          <div className="display" style={{ fontSize: 24, color: 'var(--ink)' }}>${g.price}</div>
        </div>
      </div>
    </div>);

}

function HowItWorks() {
  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="label" style={{ marginBottom: 10 }}>01 → How it works</div>
          <h2 className="display" style={{ fontSize: 'clamp(38px, 7vw, 80px)', margin: 0, maxWidth: 780, letterSpacing: '-.03em' }}>
            Find a game.<br />Pay your captain.<br /><span className="scribble">Just play.</span>
          </h2>
        </div>
        <p style={{ maxWidth: 380, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55 }}>We don't take a cut. Hosts receive payment by Interac e-Transfer → exactly how Toronto already pays. Zero card fees, ever.

        </p>
      </div>
      <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
        { n: '01', h: 'Browse the schedule', b: 'Filter by night, neighbourhood, skill, or format. Every drop-in, league, and tournament in the city.' },
        { n: '02', h: 'Reserve your spot', b: 'Hit Sign Up. We generate a unique payment reference and copy-ready Interac request to your host.' },
        { n: '03', h: 'Show up, hit balls', b: 'We auto-match your reference code from the Interac message → usually within a minute. Your spot turns green. No invoices. No fees.' }].
        map((s, i) =>
        <div className="card liftable" key={s.n} style={{ padding: 24, background: i === 1 ? 'var(--accent)' : 'var(--paper)' }}>
            <div className="jersey" style={{ fontSize: 88, marginBottom: 14 }}>{s.n}</div>
            <h3 className="display" style={{ margin: '0 0 10px', fontSize: 24, letterSpacing: '-.02em' }}>{s.h}</h3>
            <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.55 }}>{s.b}</p>
          </div>
        )}
      </div>
    </section>);

}

function FormatGrid({ onNav }) {
  return (
    <section style={{ background: 'var(--ink)', color: 'var(--paper)', borderTop: '2px solid var(--ink)', borderBottom: '2px solid var(--ink)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: .04 }}>
        <CourtSVG stroke="var(--paper)" strokeOpacity={1} style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 18px', position: 'relative' }}>
        <div className="label" style={{ color: 'rgba(251,248,241,.5)', marginBottom: 10 }}>02 → Three ways to play</div>
        <h2 className="display" style={{ fontSize: 'clamp(38px, 7vw, 80px)', margin: '0 0 36px', letterSpacing: '-.03em' }}>
          Get on<br />the <span style={{ color: 'var(--accent)' }}>court</span><span className="serif-display" style={{ fontStyle: 'italic', fontWeight: 900, color: 'var(--paper)', textTransform: 'lowercase' }}> any way</span><br />you want.
        </h2>
        <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
          { kind: 'dropin', label: 'DROP-IN', title: 'Pick-up sessions', desc: 'Single-session sign-ups across the GTA → mornings, lunch hours, evenings, weekends. Beginner clinics to competitive open gym.', stat: '~32 sessions/wk' },
          { kind: 'league', label: 'LEAGUE', title: '8–10 week seasons', desc: 'Bring a team or join solo and we draft you in. Standings, playoffs, the whole thing.', stat: '14 leagues running' },
          { kind: 'tournament', label: 'TOURNAMENT', title: 'Single-day events', desc: 'Pool play into bracket. Trophies, prize money, and bragging rights.', stat: '2 next month' }].
          map((c, i) =>
          <button key={i} onClick={() => onNav('browse')} className="liftable" style={{ appearance: 'none', cursor: 'pointer', textAlign: 'left', background: i === 0 ? 'var(--accent)' : 'transparent', color: i === 0 ? 'var(--ink)' : 'var(--paper)', padding: 24, border: '2px solid ' + (i === 0 ? 'var(--ink)' : 'var(--paper)'), borderRadius: 8, position: 'relative', overflow: 'hidden', minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '3px 3px 0 ' + (i === 0 ? 'var(--ink)' : 'var(--paper)'), fontFamily: 'var(--ui)' }}>
              <div>
                <KindBadge kind={c.kind} invert={i !== 0} />
                <h3 className="display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', margin: '18px 0 10px', lineHeight: .92, letterSpacing: '-.02em' }}>{c.title}</h3>
                <p style={{ color: i === 0 ? 'var(--ink-2)' : 'rgba(251,248,241,.7)', fontSize: 14, lineHeight: 1.5, margin: '0 0 18px' }}>{c.desc}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingTop: 14, borderTop: '2px solid ' + (i === 0 ? 'var(--ink)' : 'rgba(251,248,241,.2)') }}>
                <span className="mono" style={{ fontSize: 11, color: i === 0 ? 'var(--ink)' : 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700 }}>{c.stat}</span>
                <Icon name="arrow-right" size={20} strokeWidth={2.5} />
              </div>
            </button>
          )}
        </div>
      </div>
    </section>);

}

function ThisWeek({ onNav, t }) {
  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="label" style={{ marginBottom: 10 }}>03 → This week</div>
          <h2 className="display" style={{ fontSize: 'clamp(36px, 6vw, 64px)', margin: 0, letterSpacing: '-.03em' }}>Spots dropping <span className="serif-display" style={{ fontStyle: 'italic', textTransform: 'lowercase' }}>fast.</span></h2>
        </div>
        <button className="btn ghost" onClick={() => onNav('browse')}>See all 38 <Icon name="arrow-right" size={16} /></button>
      </div>
      <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {DROPINS.slice(0, 3).map((g) => <GameCard key={g.id} game={g} onClick={() => onNav('detail', g.id)} dense={t.density === 'compact'} />)}
      </div>
    </section>);

}

function HostCTA({ onNav }) {
  return (
    <section style={{ background: 'var(--accent)', borderTop: '2px solid var(--ink)', borderBottom: '2px solid var(--ink)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -30, right: -40, opacity: .55 }} className="hide-mobile">
        <MikasaBall size={340} />
      </div>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 18px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 36, alignItems: 'center', position: 'relative' }} className="grid grid-2">
        <div>
          <div className="label" style={{ marginBottom: 10 }}>For hosts</div>
          <h2 className="display" style={{ fontSize: 'clamp(44px, 8vw, 100px)', margin: '0 0 18px', letterSpacing: '-.04em' }}>
            You run<br />the gym.<br /><span className="serif-display" style={{ textTransform: 'lowercase', fontWeight: 900 }}>We handle</span><br />the roster.
          </h2>
          <p style={{ maxWidth: 520, fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 24px' }}>
            Post your session in 60 seconds. Players sign up and Interac you directly using a unique reference code. We track who's paid, who's still owing, and who's on the wait-list.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => onNav('host')} className="btn lg">Host a game <Icon name="arrow-right" size={18} /></button>
            <button onClick={() => onNav('roster')} className="btn lg ghost">See host tools</button>
          </div>
        </div>
        <div><HostPreviewCard /></div>
      </div>
    </section>);

}

function HostPreviewCard() {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '5px 5px 0 var(--ink)' }}>
      <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: '.14em', fontWeight: 700 }}>HOST · TUE OPEN GYM · 14/18</span>
        <span className="chip gold">7 PAID</span>
      </div>
      <div style={{ padding: 14 }}>
        {ROSTER.slice(0, 5).map((p) =>
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderBottom: '1px dashed var(--ink-3)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 11, fontFamily: 'var(--display)' }}>
              {p.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '.08em' }}>{p.ref}</div>
            </div>
            <StatusDot status={p.paid} />
          </div>
        )}
      </div>
    </div>);

}

function Stats() {
  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 18px' }}>
      <div className="grid grid-4" style={{ gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
        { n: '1,840+', l: 'Active players' },
        { n: '38', l: 'Games this week' },
        { n: '14', l: 'Leagues running' },
        { n: '$0', l: 'Booking fees' }].
        map((s, i) =>
        <div key={i} style={{ borderTop: '4px solid var(--ink)', paddingTop: 14 }}>
            <div className="display" style={{ fontSize: 'clamp(34px, 5vw, 64px)', lineHeight: .9, letterSpacing: '-.03em' }}>{s.n}</div>
            <div className="label" style={{ marginTop: 8, marginBottom: 0 }}>{s.l}</div>
          </div>
        )}
      </div>
    </section>);

}

window.Landing = Landing;