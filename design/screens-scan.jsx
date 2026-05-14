/* === Section 4 — AI food scan (4.1 – 4.3) === */
/* global React, StatusBar, HomeIndicator, I */

/* CSS-illustrated bowl: plate with rice + chicken + broccoli */
const RiceBowl = ({ size = 130 }) => (
  <div style={{ width: size, height: size, position: 'relative' }}>
    {/* plate / bowl */}
    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #2a2722 0%, #1a1814 60%, #0e0d0b 100%)', border: '1px solid #3a3830' }} />
    <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px solid rgba(246,243,233,0.06)' }} />
    {/* rice — bottom right */}
    <div style={{ position: 'absolute', width: 60, height: 38, borderRadius: '50%', bottom: 28, right: 18, background: '#e8dec6', transform: 'rotate(-12deg)', opacity: 0.92 }} />
    <div style={{ position: 'absolute', width: 6, height: 3, borderRadius: 2, bottom: 50, right: 36, background: '#fff', opacity: 0.7 }} />
    <div style={{ position: 'absolute', width: 5, height: 2.5, borderRadius: 2, bottom: 46, right: 50, background: '#fff', opacity: 0.5, transform: 'rotate(20deg)' }} />
    <div style={{ position: 'absolute', width: 5, height: 2.5, borderRadius: 2, bottom: 58, right: 28, background: '#fff', opacity: 0.6, transform: 'rotate(-20deg)' }} />
    {/* chicken — top */}
    <div style={{ position: 'absolute', width: 44, height: 28, borderRadius: '60% 50% 50% 60%', top: 28, left: 30, background: 'linear-gradient(135deg, #d99962 0%, #a8623a 100%)', transform: 'rotate(-10deg)' }} />
    <div style={{ position: 'absolute', width: 32, height: 22, borderRadius: '60% 50% 50% 60%', top: 36, left: 56, background: 'linear-gradient(135deg, #c98555 0%, #8e4d2c 100%)', transform: 'rotate(15deg)' }} />
    {/* broccoli — bottom left, 3 florets */}
    <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', bottom: 36, left: 28, background: '#5a8a3f', boxShadow: 'inset -2px -2px 0 #3d6028' }} />
    <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', bottom: 50, left: 38, background: '#6c9c50', boxShadow: 'inset -2px -2px 0 #466c2e' }} />
    <div style={{ position: 'absolute', width: 13, height: 13, borderRadius: '50%', bottom: 46, left: 24, background: '#75a358', boxShadow: 'inset -2px -2px 0 #466c2e' }} />
  </div>
);

const Brackets = ({ size }) => (
  <>
    {[
      { t: 0, l: 0, b: 't l' }, { t: 0, r: 0, b: 't r' },
      { b: 0, l: 0, b2: 'b l' }, { b: 0, r: 0, b2: 'b r' },
    ].map((p, i) => (
      <div key={i} style={{
        position: 'absolute',
        top: p.t!==undefined ? 0 : 'auto', bottom: p.b!==undefined ? 0 : 'auto',
        left: p.l!==undefined ? 0 : 'auto', right: p.r!==undefined ? 0 : 'auto',
        width: 18, height: 18,
        borderTop: p.t!==undefined ? '1.5px solid var(--accent)' : undefined,
        borderBottom: p.b!==undefined ? '1.5px solid var(--accent)' : undefined,
        borderLeft: p.l!==undefined ? '1.5px solid var(--accent)' : undefined,
        borderRight: p.r!==undefined ? '1.5px solid var(--accent)' : undefined,
      }} />
    ))}
  </>
);

const Scan_View = () => (
  <>
    <StatusBar light />
    <div className="screen-body" style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a1815 0%, #0a0908 70%)', position: 'relative' }}>
      <div className="screen-pad" style={{ paddingTop: 6 }}>
        <div className="between">
          <h1 className="display" style={{ fontSize: 22, margin: 0, color: 'var(--text)' }}>Point. <em>Done</em>.</h1>
          <span className="pill"><span className="dot" />Analyzing · 94%</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', width: 180, height: 180 }}>
          <Brackets />
          {/* tag above */}
          <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', padding: '4px 10px', borderRadius: 99, background: 'rgba(220,255,79,0.12)', color: 'var(--accent)', border: '1px solid rgba(220,255,79,0.3)', fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
            Chicken · rice · broccoli
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RiceBowl size={140} />
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 92, left: 0, right: 0, textAlign: 'center', color: 'var(--text-2)', fontSize: 12 }}>
        Hold steady — auto-detecting
      </div>
      {/* shutter */}
      <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-2)' }}><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3"/><path d="M9 4 h6"/></svg>
        </div>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 24px rgba(220,255,79,0.4), 0 0 0 4px rgba(220,255,79,0.15)' }} />
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
          <div style={{ width: 16, height: 16 }}>{I.search}</div>
        </div>
      </div>
    </div>
    <HomeIndicator />
  </>
);

const Scan_Result = () => (
  <>
    <StatusBar light />
    {/* camera bg dimmed */}
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, #1a1815 0%, #0a0908 60%)' }} />
    <div style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', opacity: 0.35 }}>
      <RiceBowl size={90} />
    </div>
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, rgba(11,11,10,0.4) 30%, var(--bg-warm) 50%)' }} />
    {/* sheet */}
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 175, background: 'var(--bg-warm)', borderRadius: '20px 20px 0 0', padding: '12px 20px 22px', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
      <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border-hi)', alignSelf: 'center', marginBottom: 14 }} />
      <div className="between" style={{ marginBottom: 4 }}>
        <span className="mono">Est. portion · 420 g</span>
        <span className="pill good"><span className="dot" />94% match</span>
      </div>
      <h1 className="display" style={{ fontSize: 22, margin: 0, marginTop: 6, marginBottom: 14, lineHeight: 1.1 }}>Chicken &amp; rice bowl</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="card" style={{ padding: 10 }}>
          <div className="mono" style={{ marginBottom: 4 }}>kcal</div>
          <div className="display" style={{ fontSize: 26, lineHeight: 1 }}>547</div>
        </div>
        <div className="card" style={{ padding: 10 }}>
          <div className="mono lime" style={{ marginBottom: 4 }}>Protein</div>
          <div className="display" style={{ fontSize: 26, lineHeight: 1 }}>48<span style={{ fontSize: 12, color: 'var(--text-3)' }}>g</span></div>
        </div>
        <div className="card" style={{ padding: 10 }}>
          <div className="mono orange" style={{ marginBottom: 4 }}>Carbs</div>
          <div className="display" style={{ fontSize: 26, lineHeight: 1 }}>62<span style={{ fontSize: 12, color: 'var(--text-3)' }}>g</span></div>
        </div>
        <div className="card" style={{ padding: 10 }}>
          <div className="mono amber" style={{ marginBottom: 4 }}>Fat</div>
          <div className="display" style={{ fontSize: 26, lineHeight: 1 }}>12<span style={{ fontSize: 12, color: 'var(--text-3)' }}>g</span></div>
        </div>
      </div>
      <div className="between" style={{ padding: '11px 0', borderTop: '1px solid var(--border)', fontSize: 12.5 }}>
        <span className="t2">Tap to adjust portion</span>
        <span className="mono lime">420 g →</span>
      </div>
      <div className="between" style={{ padding: '11px 0', borderTop: '1px solid var(--border)', fontSize: 12.5 }}>
        <span className="t2">Looks wrong?</span>
        <span className="mono">Try again →</span>
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary btn-block" style={{ marginTop: 10 }}>Log as lunch · 12:45</button>
    </div>
    <HomeIndicator />
  </>
);

const Scan_LowConf = () => (
  <>
    <StatusBar light />
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, #1a1815 0%, #0a0908 60%)' }} />
    <div style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', opacity: 0.25, filter: 'blur(1px)' }}>
      <RiceBowl size={90} />
    </div>
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, rgba(11,11,10,0.4) 30%, var(--bg-warm) 50%)' }} />
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 175, background: 'var(--bg-warm)', borderRadius: '20px 20px 0 0', padding: '12px 20px 22px', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
      <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border-hi)', alignSelf: 'center', marginBottom: 14 }} />
      <div className="between" style={{ marginBottom: 4 }}>
        <span className="mono">Est. portion · ~ 400 g</span>
        <span className="pill amber"><span className="dot" style={{background:'var(--amber)', boxShadow:'0 0 6px var(--amber)'}} />62% match</span>
      </div>
      <h1 className="display" style={{ fontSize: 20, margin: 0, marginTop: 6, marginBottom: 10, lineHeight: 1.1 }}>Chicken-ish rice bowl?</h1>
      <div className="card" style={{ padding: 12, marginBottom: 12, borderColor: 'rgba(233,196,106,0.25)', background: 'rgba(233,196,106,0.04)' }}>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
          <span className="amber" style={{ fontFamily: 'var(--display)', fontStyle: 'italic' }}>Not totally sure.</span> Adjust the portion below, or try a better-lit shot.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div className="card" style={{ padding: 10 }}>
          <div className="mono" style={{ marginBottom: 4 }}>kcal</div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>~520</div>
        </div>
        <div className="card" style={{ padding: 10 }}>
          <div className="mono lime" style={{ marginBottom: 4 }}>Protein</div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>~45<span style={{ fontSize: 11, color: 'var(--text-3)' }}>g</span></div>
        </div>
        <div className="card" style={{ padding: 10 }}>
          <div className="mono orange" style={{ marginBottom: 4 }}>Carbs</div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>~60<span style={{ fontSize: 11, color: 'var(--text-3)' }}>g</span></div>
        </div>
        <div className="card" style={{ padding: 10 }}>
          <div className="mono amber" style={{ marginBottom: 4 }}>Fat</div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>~11<span style={{ fontSize: 11, color: 'var(--text-3)' }}>g</span></div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div className="stack" style={{ gap: 8 }}>
        <button className="btn btn-primary btn-block">Adjust &amp; log</button>
        <button className="btn btn-ghost btn-block" style={{ fontSize: 12.5 }}>Re-scan</button>
      </div>
    </div>
    <HomeIndicator />
  </>
);

Object.assign(window, { Scan_View, Scan_Result, Scan_LowConf });
