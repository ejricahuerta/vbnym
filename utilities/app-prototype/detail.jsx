// Detail + signup flow → mobile-first

function Detail({ eventId, onNav, onSignup, signedUp }) {
  const ev = ALL_EVENTS.find((e) => e.id === eventId) || DROPINS[0];
  const { toast } = useToast();
  const [step, setStep] = React.useState(signedUp ? 'sent' : 'detail');
  const [form, setForm] = React.useState({ name: '', email: '', notes: '' });
  const ref = React.useMemo(() => {
    const initials = form.name.trim().split(/\s+/).map((p) => p[0] || '').join('').toUpperCase().slice(0, 2) || 'XX';
    return `6B-${initials}-${String(7400 + Math.floor(Math.random() * 99))}`;
  }, [step === 'interac']);

  const dark = ev.kind === 'league';

  return (
    <div>
      <section style={{ borderBottom: '2px solid var(--ink)', background: dark ? 'var(--ink)' : 'var(--bg)', color: dark ? 'var(--paper)' : 'var(--ink)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 18px 12px' }}>
          <button onClick={() => onNav('browse')} className="focusable" style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', color: 'inherit', fontSize: 12, fontWeight: 600, opacity: .7, fontFamily: 'var(--mono)', letterSpacing: '.08em', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="arrow-left" size={14} /> BACK TO SCHEDULE</button>
        </div>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '8px 18px 40px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32 }} className="grid grid-2">
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <KindBadge kind={ev.kind} invert={dark} />
              <span className="chip outline" style={dark ? { color: 'var(--paper)', borderColor: 'var(--paper)' } : {}}>{ev.skill}</span>
              <span className="chip outline" style={dark ? { color: 'var(--paper)', borderColor: 'var(--paper)' } : {}}>CO-ED 6S</span>
            </div>
            <h1 className="display" style={{ fontSize: 'clamp(36px, 7vw, 80px)', margin: '0 0 14px', lineHeight: .92, letterSpacing: '-.03em' }}>{ev.title}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', fontSize: 14, opacity: .85 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={14} /><strong>{formatDay(ev.start || ev.startDate || ev.date)}</strong> {ev.start && `· ${formatRange(ev.start, ev.durationMin)}`}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="map-pin" size={14} />{ev.venue.name}, {ev.venue.area}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="user" size={14} />{ev.host.name}</div>
            </div>
          </div>
          <div>
            <SignupBox ev={ev} step={step} setStep={setStep} form={form} setForm={setForm} onSignup={onSignup} ref_={ref} />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 18px' }}>
        <div className="grid grid-2" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
          <div>
            <div className="label">Format</div>
            <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 680 }}>{ev.format}. Show up 10 minutes early. Captains pick balanced teams. We rotate every 25 minutes.</p>
            <div className="label">Your host</div>
            <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 18, fontFamily: 'var(--display)' }}>
                {ev.host.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{ev.host.name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.08em', fontWeight: 700 }}>★ {ev.host.rating} · {ev.host.runs} GAMES RUN</div>
              </div>
              <button className="btn sm ghost">Message</button>
            </div>
          </div>
          <div>
            <div className="label">Roster · {ev.signed || ev.teamsIn || 0}</div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {ROSTER.slice(0, 8).map((p, i) =>
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i === 7 ? 'none' : '1px dashed var(--ink-3)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg)', border: '1.5px solid var(--ink)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 11, fontFamily: 'var(--display)' }}>
                    {p.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                </div>
              )}
              <div style={{ padding: '12px 14px', textAlign: 'center', fontSize: 11, color: 'var(--ink-3)', background: 'var(--bg)', letterSpacing: '.12em', fontWeight: 700 }} className="mono">+ {(ev.signed || ev.teamsIn || 0) - 8} MORE</div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>);

}

function SignupBox({ ev, step, setStep, form, setForm, onSignup, ref_ }) {
  const price = ev.price || ev.pricePerTeam || 0;
  const spotsLeft = (ev.capacity || ev.teamCap) - (ev.signed || ev.teamsIn || 0);
  const message = `Hi ${ev.host.name.split(' ')[0]}! Sending $${price} for ${ev.title} on ${formatDay(ev.start || ev.startDate || ev.date)}. Reference: ${ref_}. → ${form.name || '[Your name]'}`;
  const [copied, setCopied] = React.useState('');
  const copy = (txt, key) => {navigator.clipboard.writeText(txt);setCopied(key);setTimeout(() => setCopied(''), 1400);};

  if (step === 'sent') {
    return (
      <div className="card accent" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '2px solid var(--ink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="display" style={{ fontSize: 14 }}>YOU'RE IN</span>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>{ref_}</span>
        </div>
        <div style={{ padding: 22, background: 'var(--paper)' }}>
          <div className="display" style={{ fontSize: 38, lineHeight: .95, marginBottom: 10, letterSpacing: '-.03em' }}>See you<br /><span className="serif-display" style={{ fontStyle: 'italic', textTransform: 'lowercase' }}>on court.</span></div>
          <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>Your spot is held. We auto-match your reference code in the Interac message → usually within a minute of it landing → and your status flips to confirmed.</p>
          <div className="card thin" style={{ padding: 14, background: 'var(--bg)', marginBottom: 14, boxShadow: 'none' }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--ink-3)', marginBottom: 6, fontWeight: 700 }}>PAYMENT STATUS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}>
              <span className="pulse" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--ink)' }} />
              Awaiting confirmation from {ev.host.name.split(' ')[0]}
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild><button className="btn ghost sm" style={{ width: '100%' }}>Cancel my spot</button></DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Cancel your spot?</DialogTitle>
                <DialogDescription>
                  We'll remove you from the roster and notify {ev.host.name.split(' ')[0]} so they can offer the spot to the wait-list. Refunds are at the host's discretion.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose>Keep my spot</DialogClose>
                <Button variant="destructive" onClick={() => {onSignup && onSignup(ev.id, false);}}>Yes, cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>);

  }

  if (step === 'interac') {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '2px solid var(--ink)', background: 'var(--ink)', color: 'var(--paper)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="display" style={{ fontSize: 14, color: 'var(--accent)' }}>SEND INTERAC E-TRANSFER</span>
          <span className="chip gold">2 / 2</span>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--ink-3)', fontWeight: 700 }}>AMOUNT</div>
              <div className="display" style={{ fontSize: 34, lineHeight: 1, letterSpacing: '-.03em' }}>${price}.00</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--ink-3)', fontWeight: 700 }}>REFERENCE</div>
              <div className="display" style={{ fontSize: 18, lineHeight: 1.2, marginTop: 6 }}>{ref_}</div>
            </div>
          </div>
          <div className="label">Send to</div>
          <div className="card thin" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, background: 'var(--bg)' }}>
            <span className="mono" style={{ fontSize: 13.5, fontWeight: 700 }}>{ev.host.email}</span>
            <button onClick={() => copy(ev.host.email, 'email')} className="btn xs">{copied === 'email' ? '✓ Copied' : 'Copy'}</button>
          </div>
          <div className="label">Auto-generated message</div>
          <div className="card thin" style={{ padding: '10px 12px', marginBottom: 14, background: 'var(--bg)' }}>
            <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>{message}</div>
            <button onClick={() => copy(message, 'msg')} className="btn xs ghost">{copied === 'msg' ? '✓ Copied' : 'Copy message'}</button>
          </div>
          <ol style={{ paddingLeft: 18, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: '0 0 16px' }}>
            <li>Open your bank app → Interac e-Transfer</li>
            <li>Send <strong>${price}</strong> to <strong>{ev.host.email}</strong></li>
            <li>Paste the reference in the message field</li>
            <li>Tap "I sent it" so your host knows to expect it</li>
          </ol>
          <button onClick={() => {setStep('sent');onSignup && onSignup(ev.id, true);toast({ title: 'Roster updated', description: `You're on the list. Watch for confirmation from ${ev.host.name.split(' ')[0]}.`, variant: 'accent' });}} className="btn lg accent" style={{ width: '100%' }}><Icon name="check" size={18} /> I sent the e-Transfer</button>
          <button onClick={() => setStep('form')} className="btn ghost sm" style={{ width: '100%', marginTop: 8 }}>Back</button>
        </div>
      </div>);

  }

  if (step === 'form') {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '2px solid var(--ink)', background: 'var(--accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="display" style={{ fontSize: 14 }}>YOUR INFO</span>
          <span className="chip">1 / 2</span>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Aisha Rahman" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, fontWeight: 600, letterSpacing: '.04em', lineHeight: 1.5 }}>
              Use the email tied to your <strong style={{ color: 'var(--ink)' }}>active Interac account</strong> → we match it against the e-Transfer to confirm your spot.
            </div>
          </div>
          <button onClick={() => setStep('interac')} className="btn lg" disabled={!form.name || !form.email} style={{ width: '100%', opacity: !form.name || !form.email ? .4 : 1 }}>Continue to Interac <Icon name="arrow-right" size={16} /></button>
        </div>
      </div>);

  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', color: 'rgba(251,248,241,.5)', fontWeight: 700 }}>{ev.kind === 'dropin' ? 'PER PLAYER' : 'PER TEAM'}</div>
          <div className="display" style={{ fontSize: 38, color: 'var(--accent)', lineHeight: 1 }}>${price}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '.14em', color: 'rgba(251,248,241,.5)', fontWeight: 700 }}>SPOTS LEFT</div>
          <div className="display" style={{ fontSize: 38, lineHeight: 1 }}>{spotsLeft}</div>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 6, letterSpacing: '.08em', fontWeight: 700 }} className="mono">
          <span>{ev.signed || ev.teamsIn} SIGNED</span><span>OF {ev.capacity || ev.teamCap}</span>
        </div>
        <div style={{ height: 10, borderRadius: 0, background: 'var(--bg)', border: '2px solid var(--ink)', overflow: 'hidden', marginBottom: 18 }}>
          <div style={{ height: '100%', width: `${(ev.signed || ev.teamsIn) / (ev.capacity || ev.teamCap) * 100}%`, background: 'var(--accent)' }} />
        </div>
        <button onClick={() => setStep('form')} className="btn lg accent" style={{ width: '100%' }} disabled={spotsLeft <= 0}>
          {spotsLeft <= 0 ? 'Join wait-list' : ev.kind === 'dropin' ? 'Sign me up' : 'Register team'} <Icon name="arrow-right" size={18} />
        </button>
        <div className="mono" style={{ fontSize: 10, textAlign: 'center', marginTop: 10, color: 'var(--ink-3)', letterSpacing: '.14em', fontWeight: 700 }}>NO CARD FEES · INTERAC ONLY</div>
      </div>
    </div>);

}

window.Detail = Detail;