/* === Section 1 — Onboarding (1.1 – 1.7) === */
/* global React, StatusBar, HomeIndicator, I, Phone, Section */

const Onb_Welcome = () => (
  <>
    <StatusBar />
    <div className="screen-body screen-pad" style={{ paddingTop: 28 }}>
      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
        <div style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
        <span className="mono">Plate</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 12 }}>
        <h1 className="display" style={{ fontSize: 38, lineHeight: 1.05, margin: 0, marginBottom: 18 }}>
          Eat <em>smart</em>.<br />Lift heavier.<br />Run further.
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14.5, margin: 0, marginBottom: 6, maxWidth: '90%' }}>
          Your daily nutrition + AI coach, in one app.
        </p>
      </div>
      <div className="stack" style={{ gap: 10, paddingBottom: 14 }}>
        <button className="btn btn-dark btn-block">{I.apple}<span>Continue with Apple</span></button>
        <button className="btn btn-surface btn-block">{I.google}<span>Continue with Google</span></button>
        <button className="btn btn-ghost btn-block">Use email</button>
        <p style={{ fontSize: 10.5, color: 'var(--text-3)', textAlign: 'center', margin: '6px 0 0', lineHeight: 1.4 }}>
          By continuing you agree to Terms &amp; Privacy.
        </p>
      </div>
    </div>
    <HomeIndicator />
  </>
);

const Onb_Sex = () => (
  <>
    <StatusBar />
    <div className="screen-body screen-pad" style={{ paddingTop: 18 }}>
      <div className="between" style={{ marginBottom: 28 }}>
        <span className="mono">Step 1 · 6</span>
        <div style={{ width: 90, height: 3, borderRadius: 99, background: 'var(--surface-2)' }}>
          <div style={{ width: '16%', height: '100%', borderRadius: 99, background: 'var(--accent)' }} />
        </div>
      </div>
      <h1 className="display" style={{ fontSize: 30, margin: 0, marginBottom: 8, lineHeight: 1.1 }}>
        A couple of <em>basics</em>.
      </h1>
      <p className="t2" style={{ margin: 0, marginBottom: 24, fontSize: 13.5 }}>Sex assigned at birth, used for BMR.</p>
      <div className="stack" style={{ gap: 10 }}>
        <button className="card-2" style={{ height: 52, borderRadius: 14, textAlign: 'left', paddingLeft: 18, color: 'var(--text)', borderColor: 'var(--accent)', background: 'rgba(220,255,79,0.06)', fontFamily: 'var(--display)', fontSize: 18 }}>Male</button>
        <button className="card-2" style={{ height: 52, borderRadius: 14, textAlign: 'left', paddingLeft: 18, color: 'var(--text-2)', fontFamily: 'var(--display)', fontSize: 18 }}>Female</button>
        <button className="card-2" style={{ height: 52, borderRadius: 14, textAlign: 'left', paddingLeft: 18, color: 'var(--text-2)', fontFamily: 'var(--display)', fontSize: 14, lineHeight: 1.2 }}>Prefer not to say</button>
      </div>
      <div className="mono" style={{ marginTop: 22, marginBottom: 8 }}>Birthdate</div>
      <div className="card-2" style={{ padding: 0, height: 132, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 36, transform: 'translateY(-50%)', borderTop: '1px solid var(--border-hi)', borderBottom: '1px solid var(--border-hi)', background: 'rgba(220,255,79,0.04)' }} />
        <div className="row" style={{ height: '100%', fontFamily: 'var(--display)', fontSize: 20, justifyContent: 'space-around', position: 'relative', zIndex: 1 }}>
          <div className="stack" style={{ alignItems: 'center', gap: 10, color: 'var(--text-3)' }}><span style={{ opacity: 0.5 }}>Feb</span><span style={{ color: 'var(--text)' }}>Mar</span><span style={{ opacity: 0.5 }}>Apr</span></div>
          <div className="stack" style={{ alignItems: 'center', gap: 10, color: 'var(--text-3)' }}><span style={{ opacity: 0.5 }}>11</span><span style={{ color: 'var(--text)' }}>12</span><span style={{ opacity: 0.5 }}>13</span></div>
          <div className="stack" style={{ alignItems: 'center', gap: 10, color: 'var(--text-3)' }}><span style={{ opacity: 0.5 }}>1996</span><span style={{ color: 'var(--text)' }}>1997</span><span style={{ opacity: 0.5 }}>1998</span></div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary btn-block" style={{ marginBottom: 14 }}>Continue {I.arrowR}</button>
    </div>
    <HomeIndicator />
  </>
);

const Onb_HW = () => (
  <>
    <StatusBar />
    <div className="screen-body screen-pad" style={{ paddingTop: 18 }}>
      <div className="between" style={{ marginBottom: 28 }}>
        <span className="mono">Step 2 · 6</span>
        <div className="row" style={{ background: 'var(--surface-2)', borderRadius: 99, padding: 3, gap: 2, fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <span style={{ padding: '4px 9px', borderRadius: 99, background: 'var(--accent)', color: '#0b0b0a' }}>Metric</span>
          <span style={{ padding: '4px 9px', borderRadius: 99, color: 'var(--text-3)' }}>Imperial</span>
        </div>
      </div>
      <h1 className="display" style={{ fontSize: 30, margin: 0, marginBottom: 8, lineHeight: 1.1 }}>
        How <em>tall</em>, how <em>heavy</em>?
      </h1>
      <p className="t2" style={{ margin: 0, marginBottom: 24, fontSize: 13.5 }}>You can change these later.</p>
      <div className="stack" style={{ gap: 14 }}>
        <div className="card-2" style={{ padding: 18 }}>
          <div className="mono" style={{ marginBottom: 6 }}>Height</div>
          <div className="display" style={{ fontSize: 36, lineHeight: 1 }}>178 <span style={{ fontSize: 18, color: 'var(--text-3)' }}>cm</span></div>
        </div>
        <div className="card-2" style={{ padding: 18, borderColor: 'var(--border-hi)' }}>
          <div className="mono" style={{ marginBottom: 6 }}>Weight</div>
          <div className="display" style={{ fontSize: 36, lineHeight: 1 }}>76.4 <span style={{ fontSize: 18, color: 'var(--text-3)' }}>kg</span></div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary btn-block" style={{ marginBottom: 14 }}>Continue {I.arrowR}</button>
    </div>
    <HomeIndicator />
  </>
);

const Onb_Activities = () => {
  const acts = [
    ['gym', 'Gym', true],
    ['run', 'Running', true],
    ['bike', 'Cycling', false],
    ['swim', 'Swimming', false],
    ['sport', 'Sports', true],
    ['yoga', 'Yoga', false],
    ['walk', 'Walking', false],
  ];
  return (
    <>
      <StatusBar />
      <div className="screen-body screen-pad" style={{ paddingTop: 18 }}>
        <div className="between" style={{ marginBottom: 24 }}>
          <span className="mono">Step 3 · 6</span>
          <span className="mono lime">3 selected</span>
        </div>
        <h1 className="display" style={{ fontSize: 28, margin: 0, marginBottom: 6, lineHeight: 1.1 }}>
          What do you <em>move</em> for?
        </h1>
        <p className="t2" style={{ margin: 0, marginBottom: 22, fontSize: 13 }}>Pick all that apply. We'll tune your coach for these.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {acts.map(([k, label, active]) => (
            <div key={k} className={`chip ${active ? 'active' : ''}`} style={{ padding: '10px 14px', fontSize: 13 }}>
              {I[k]}<span>{label}</span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-block" style={{ marginBottom: 14 }}>Continue {I.arrowR}</button>
      </div>
      <HomeIndicator />
    </>
  );
};

const Onb_Goal = () => {
  const goals = [
    ['Lose fat', 'Cut calories, keep muscle.', I.arrowR, false],
    ['Maintain', 'Hold steady at current weight.', I.target, false],
    ['Gain muscle', 'Eat in surplus, train hard.', I.arrowUp, false],
    ['Recomp', 'Lose fat + gain muscle, slower.', I.rebuild, true],
  ];
  return (
    <>
      <StatusBar />
      <div className="screen-body screen-pad" style={{ paddingTop: 18 }}>
        <div className="between" style={{ marginBottom: 24 }}>
          <span className="mono">Step 4 · 6</span>
        </div>
        <h1 className="display" style={{ fontSize: 30, margin: 0, marginBottom: 6, lineHeight: 1.1 }}>
          What are you <em>after</em>?
        </h1>
        <p className="t2" style={{ margin: 0, marginBottom: 20, fontSize: 13 }}>Pick one. You can change it any time.</p>
        <div className="stack" style={{ gap: 10 }}>
          {goals.map(([t, d, ic, sel]) => (
            <div key={t} className="card-2" style={{ padding: 14, border: sel ? '1px solid var(--accent)' : '1px solid var(--border)', background: sel ? 'rgba(220,255,79,0.05)' : 'var(--surface-2)' }}>
              <div className="row" style={{ gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: sel ? 'var(--accent)' : 'var(--surface)', color: sel ? '#0b0b0a' : 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 18, height: 18 }}>{ic}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="display" style={{ fontSize: 17, lineHeight: 1.1 }}>{t}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{d}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-block" style={{ marginBottom: 14 }}>Continue {I.arrowR}</button>
      </div>
      <HomeIndicator />
    </>
  );
};

const Onb_Rate = () => (
  <>
    <StatusBar />
    <div className="screen-body screen-pad" style={{ paddingTop: 18 }}>
      <div className="between" style={{ marginBottom: 28 }}>
        <span className="mono">Step 5 · 6</span>
      </div>
      <h1 className="display" style={{ fontSize: 30, margin: 0, marginBottom: 6, lineHeight: 1.1 }}>
        How <em>fast</em>?
      </h1>
      <p className="t2" style={{ margin: 0, marginBottom: 36, fontSize: 13 }}>Pace of change. Steady is best for most.</p>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="display" style={{ fontSize: 56, lineHeight: 1 }}>0.5 <span style={{ fontSize: 22, color: 'var(--text-3)' }}>kg / wk</span></div>
      </div>
      <div style={{ position: 'relative', height: 36, marginBottom: 6 }}>
        <div style={{ position: 'absolute', top: 16, left: 0, right: 0, height: 4, borderRadius: 99, background: 'var(--surface-2)' }} />
        <div style={{ position: 'absolute', top: 16, left: 0, width: '50%', height: 4, borderRadius: 99, background: 'var(--accent)' }} />
        {[0, 25, 50, 75, 100].map(p => (
          <div key={p} style={{ position: 'absolute', top: 14, left: `${p}%`, width: 1, height: 8, background: 'var(--border-hi)' }} />
        ))}
        <div style={{ position: 'absolute', top: 8, left: 'calc(50% - 10px)', width: 20, height: 20, borderRadius: 99, background: 'var(--accent)', boxShadow: '0 0 14px rgba(220,255,79,0.5), 0 0 0 4px var(--bg-warm)' }} />
      </div>
      <div className="between" style={{ fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-3)', marginBottom: 22 }}>
        <span>Easy <span style={{ color: 'var(--text-2)' }}>0.25</span></span>
        <span style={{ color: 'var(--accent)' }}>Steady 0.5</span>
        <span>Aggro <span style={{ color: 'var(--text-2)' }}>0.75</span></span>
      </div>
      <div className="card-2" style={{ padding: 14, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
        <span className="lime">→</span> Faster isn't better. Most people do best at steady.
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary btn-block" style={{ marginBottom: 14 }}>Continue {I.arrowR}</button>
    </div>
    <HomeIndicator />
  </>
);

const Onb_Targets = () => (
  <>
    <StatusBar />
    <div className="screen-body screen-pad" style={{ paddingTop: 18 }}>
      <div className="between" style={{ marginBottom: 22 }}>
        <span className="mono">Step 6 · 6</span>
        <span className="pill"><span className="dot" />Computed</span>
      </div>
      <h1 className="display" style={{ fontSize: 26, margin: 0, marginBottom: 6, lineHeight: 1.15 }}>
        Your daily targets, <em>calculated</em>.
      </h1>
      <p className="t2" style={{ margin: 0, marginBottom: 18, fontSize: 12.5 }}>From your inputs. Adjust anytime.</p>
      <div className="card-2" style={{ padding: 16, marginBottom: 14, textAlign: 'center' }}>
        <div className="mono" style={{ marginBottom: 6 }}>Daily energy</div>
        <div className="display" style={{ fontSize: 44, lineHeight: 1 }}>2,180 <span style={{ fontSize: 16, color: 'var(--text-3)' }}>kcal</span></div>
        <div className="mono" style={{ marginTop: 8, color: 'var(--text-3)' }}>BMR 1,640 + Act 540</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
        <div className="card-2" style={{ padding: 10 }}>
          <div className="mono" style={{ color: 'var(--accent)', marginBottom: 4 }}>Protein</div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>175<span style={{ fontSize: 11, color: 'var(--text-3)' }}>g</span></div>
          <div className="mono" style={{ marginTop: 4 }}>per day</div>
        </div>
        <div className="card-2" style={{ padding: 10 }}>
          <div className="mono" style={{ color: 'var(--accent-2)', marginBottom: 4 }}>Carbs</div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>220<span style={{ fontSize: 11, color: 'var(--text-3)' }}>g</span></div>
          <div className="mono" style={{ marginTop: 4 }}>per day</div>
        </div>
        <div className="card-2" style={{ padding: 10 }}>
          <div className="mono" style={{ color: 'var(--amber)', marginBottom: 4 }}>Fat</div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>70<span style={{ fontSize: 11, color: 'var(--text-3)' }}>g</span></div>
          <div className="mono" style={{ marginTop: 4 }}>per day</div>
        </div>
      </div>
      <button className="btn btn-ghost btn-block" style={{ fontSize: 12.5 }}>Adjust manually</button>
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary btn-block" style={{ marginBottom: 14 }}>Looks good {I.arrowR}</button>
    </div>
    <HomeIndicator />
  </>
);

Object.assign(window, { Onb_Welcome, Onb_Sex, Onb_HW, Onb_Activities, Onb_Goal, Onb_Rate, Onb_Targets });
