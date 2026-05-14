/* === Section 3 — Logging food (3.1 – 3.3) === */
/* global React, StatusBar, HomeIndicator, I, TabBar */

const Log_Search = () => {
  const items = [
    ['Banana, medium', '105 kcal · 1.3p · 27c · 0.4f'],
    ['Greek yogurt, 200 g', '170 kcal · 20p · 9c · 5f'],
    ['Whey protein, 1 scoop', '120 kcal · 24p · 3c · 1.5f'],
    ['Chicken breast, 150 g', '231 kcal · 43p · 0c · 5f'],
    ['Jasmine rice, cooked 100 g', '130 kcal · 2.7p · 28c · 0.3f'],
    ['Avocado, 1/2', '160 kcal · 2p · 8.5c · 15f'],
  ];
  return (
    <>
      {/* Dim backdrop showing today behind */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-warm)', opacity: 1 }}>
        <StatusBar />
        <div className="screen-pad" style={{ paddingTop: 6, opacity: 0.4 }}>
          <h1 className="display" style={{ fontSize: 22, margin: 0, marginTop: 4 }}>Afternoon, Alex —</h1>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      </div>
      {/* Sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 100, background: 'var(--bg-warm)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: '12px 20px 14px', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border-hi)', alignSelf: 'center', marginBottom: 14 }} />
        <div className="between" style={{ marginBottom: 14 }}>
          <span className="display" style={{ fontSize: 20 }}>Add food</span>
          <span style={{ color: 'var(--text-3)', display: 'inline-flex' }}><div style={{ width: 18, height: 18 }}>{I.x}</div></span>
        </div>
        <div className="input focused row" style={{ gap: 10, paddingLeft: 14 }}>
          <div style={{ width: 16, height: 16, color: 'var(--text-3)' }}>{I.search}</div>
          <span style={{ flex: 1, color: 'var(--text)', fontSize: 13.5 }}>chick<span style={{ display: 'inline-block', width: 1.5, height: 14, background: 'var(--accent)', marginLeft: 1, verticalAlign: 'middle' }} /></span>
          <span className="mono lime">Voice</span>
        </div>
        <div className="row" style={{ gap: 4, marginTop: 14, marginBottom: 6, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          <span style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--accent)' }}>Recent</span>
          <span style={{ padding: '8px 10px', color: 'var(--text-3)' }}>Foods</span>
          <span style={{ padding: '8px 10px', color: 'var(--text-3)' }}>My meals</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {items.map(([n, m], i) => (
            <div key={i} className="row" style={{ gap: 12, padding: '11px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, lineHeight: 1.2, marginBottom: 3 }}>{n}</div>
                <div className="mono" style={{ textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{m}</div>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
                <div style={{ width: 14, height: 14 }}>{I.plus}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <HomeIndicator />
    </>
  );
};

const Log_Portion = () => (
  <>
    <StatusBar />
    <div className="screen-body screen-pad" style={{ paddingTop: 12 }}>
      <div className="between" style={{ marginBottom: 22 }}>
        <span style={{ color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 16, height: 16 }}>{I.arrowL}</div>
          <span className="mono">Back</span>
        </span>
        <span style={{ color: 'var(--text-3)', display: 'inline-flex' }}><div style={{ width: 18, height: 18 }}>{I.x}</div></span>
      </div>
      <div className="mono" style={{ marginBottom: 6 }}>Chicken breast</div>
      <div className="display" style={{ fontSize: 18, marginBottom: 18 }}>Adjust portion</div>
      <div className="row" style={{ justifyContent: 'center', gap: 22, alignItems: 'center', marginBottom: 18 }}>
        <div style={{ width: 36, height: 36, borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
          <div style={{ width: 16, height: 16 }}>{I.minus}</div>
        </div>
        <div className="display" style={{ fontSize: 60, lineHeight: 1 }}>150<span style={{ fontSize: 22, color: 'var(--text-3)' }}> g</span></div>
        <div style={{ width: 36, height: 36, borderRadius: 99, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b0b0a' }}>
          <div style={{ width: 16, height: 16 }}>{I.plus}</div>
        </div>
      </div>
      <div className="row" style={{ gap: 6, justifyContent: 'space-between', marginBottom: 22 }}>
        {['50g','100g','150g','200g','Custom'].map((s, i) => (
          <div key={s} className={i===2 ? 'chip active' : 'chip'} style={{ padding: '8px 10px', fontSize: 11, justifyContent: 'center' }}>{s}</div>
        ))}
      </div>
      <div className="card" style={{ padding: 12, marginBottom: 18 }}>
        <div className="mono" style={{ marginBottom: 8 }}>This portion</div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="stack" style={{ alignItems: 'flex-start' }}>
            <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>231</div>
            <div className="mono">kcal</div>
          </div>
          <div className="stack" style={{ alignItems: 'flex-start' }}>
            <div className="display" style={{ fontSize: 22, lineHeight: 1, color: 'var(--accent)' }}>43</div>
            <div className="mono">protein</div>
          </div>
          <div className="stack" style={{ alignItems: 'flex-start' }}>
            <div className="display" style={{ fontSize: 22, lineHeight: 1, color: 'var(--accent-2)' }}>0</div>
            <div className="mono">carbs</div>
          </div>
          <div className="stack" style={{ alignItems: 'flex-start' }}>
            <div className="display" style={{ fontSize: 22, lineHeight: 1, color: 'var(--amber)' }}>5</div>
            <div className="mono">fat</div>
          </div>
        </div>
      </div>
      <div className="mono" style={{ marginBottom: 6 }}>Meal</div>
      <div className="row" style={{ gap: 6, marginBottom: 18 }}>
        {['Breakfast','Lunch','Dinner','Snack'].map((s, i) => (
          <div key={s} className={i===1 ? 'chip active' : 'chip'} style={{ flex: 1, padding: '9px 6px', fontSize: 11.5, justifyContent: 'center' }}>{s}</div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary btn-block" style={{ marginBottom: 14 }}>Add to log</button>
    </div>
    <HomeIndicator />
  </>
);

const Log_Barcode = () => (
  <>
    <StatusBar light />
    <div className="screen-body" style={{ background: '#000', color: 'var(--text)', padding: 0 }}>
      <div className="between screen-pad" style={{ marginTop: 8, marginBottom: 0 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}>
          <div style={{ width: 18, height: 18 }}>{I.x}</div>
        </span>
        <span className="mono" style={{ color: 'var(--text)' }}>Barcode</span>
        <span className="mono lime">Manual</span>
      </div>
      {/* viewfinder area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 200, height: 100, position: 'relative' }}>
          {/* corner brackets */}
          {[{t:0,l:0,b:'r-t'},{t:0,r:0,b:'l-t'},{b:0,l:0,b2:'r-b'},{b:0,r:0,b2:'l-b'}].map((p, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: p.t!==undefined ? 0 : undefined, bottom: p.b!==undefined ? 0 : undefined,
              left: p.l!==undefined ? 0 : undefined, right: p.r!==undefined ? 0 : undefined,
              width: 22, height: 22,
              borderTop: p.t!==undefined ? '2px solid var(--accent)' : undefined,
              borderBottom: p.b!==undefined ? '2px solid var(--accent)' : undefined,
              borderLeft: p.l!==undefined ? '2px solid var(--accent)' : undefined,
              borderRight: p.r!==undefined ? '2px solid var(--accent)' : undefined,
            }} />
          ))}
          {/* barcode lines */}
          <div className="row" style={{ position: 'absolute', inset: '20px 12px', alignItems: 'stretch', gap: 2 }}>
            {[3,1,2,4,1,2,1,3,2,1,4,2,1,3,1,2,1,4,3,2,1,2,1,3,2,1,4,1,2,3].map((w, i) => (
              <div key={i} style={{ width: w, background: 'rgba(255,255,255,0.7)', height: '100%' }} />
            ))}
          </div>
          {/* scan line */}
          <div style={{ position: 'absolute', top: '50%', left: -4, right: -4, height: 1.5, background: 'var(--accent)', boxShadow: '0 0 12px var(--accent)' }} />
        </div>
        <div style={{ position: 'absolute', bottom: 200, textAlign: 'center', width: '100%', color: 'var(--text)', fontSize: 13 }}>
          Point at a barcode
        </div>
      </div>
      {/* result card slides up */}
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 92, background: 'var(--surface)', borderRadius: 16, padding: 14, border: '1px solid var(--border)', boxShadow: '0 14px 32px rgba(0,0,0,0.6)' }}>
        <div className="row" style={{ gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div className="display" style={{ fontSize: 22 }}>C</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="mono" style={{ marginBottom: 2 }}>Detected · 99%</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.25 }}>Plain Greek Yogurt, 0% fat</div>
            <div className="mono" style={{ marginTop: 4, color: 'var(--text-3)' }}>170g serving · 100 kcal</div>
          </div>
          <button className="btn btn-primary btn-sm" style={{ padding: '0 14px' }}>Add</button>
        </div>
        <div className="row" style={{ gap: 16, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <span><span className="mono lime">17</span> <span className="mono">p</span></span>
          <span><span className="mono orange">6</span> <span className="mono">c</span></span>
          <span><span className="mono amber">0</span> <span className="mono">f</span></span>
        </div>
      </div>
    </div>
    <HomeIndicator dark />
  </>
);

Object.assign(window, { Log_Search, Log_Portion, Log_Barcode });
