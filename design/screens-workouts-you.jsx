/* === Sections 7 + 8 — Workouts + You === */
/* global React, StatusBar, HomeIndicator, I, TabBar */

const Workouts_Main = () => (
  <>
    <StatusBar />
    <div className="screen-body">
      <div className="screen-pad">
        <div className="between" style={{ marginTop: 4, marginBottom: 18 }}>
          <h1 className="display" style={{ fontSize: 26, margin: 0, lineHeight: 1.05 }}>This <em>week</em>.</h1>
          <span className="mono">Nov 17 · 23</span>
        </div>
        {/* calendar strip */}
        <div className="row" style={{ gap: 5, marginBottom: 18 }}>
          {[['M', true], ['T', true], ['W', true], ['T', false], ['F', true], ['S', true], ['S', false]].map(([l, done], i) => (
            <div key={i} style={{ flex: 1, height: 52, borderRadius: 10, background: done ? 'var(--accent)' : 'var(--surface)', border: done ? 'none' : '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: done ? '#0b0b0a' : 'var(--text-3)' }}>
              <span className="mono" style={{ fontSize: 9, color: done ? '#0b0b0a' : 'var(--text-3)' }}>{l}</span>
              <span className="display" style={{ fontSize: 14 }}>{17+i}</span>
            </div>
          ))}
        </div>
        <div className="card-2" style={{ padding: 14, marginBottom: 18 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>5</div>
              <div className="mono" style={{ marginTop: 4 }}>Sessions</div>
            </div>
            <div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>4h 32m</div>
              <div className="mono" style={{ marginTop: 4 }}>Volume</div>
            </div>
            <div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1, color: 'var(--accent)' }}>2,140</div>
              <div className="mono" style={{ marginTop: 4 }}>kcal burn</div>
            </div>
          </div>
        </div>
        <div className="mono" style={{ marginBottom: 8 }}>Recent</div>
        {[
          ['gym', 'Push day', '8 exercises · 62 min', '12:30 PM today', 540],
          ['run', '5K easy run', '6:12/mi avg · zone 2', 'Tue · 28 min', 410],
          ['sport', 'Football pickup', '5-a-side · ~est', 'Sun · 90 min', 720],
        ].map(([k, n, d, t, cal], i) => (
          <div key={i} className="row" style={{ gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18 }}>{I[k]}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="display" style={{ fontSize: 15, lineHeight: 1.1 }}>{n}</div>
              <div className="mono" style={{ marginTop: 4 }}>{d}</div>
              <div className="mono" style={{ marginTop: 2, color: 'var(--text-3)' }}>{t}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="display" style={{ fontSize: 16 }}>{cal}</div>
              <div className="mono">kcal</div>
            </div>
          </div>
        ))}
      </div>
      {/* floating add */}
      <div style={{ position: 'absolute', right: 14, bottom: 92, padding: '11px 16px', borderRadius: 99, background: 'var(--accent)', color: '#0b0b0a', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 20px rgba(220,255,79,0.3)' }}>
        <div style={{ width: 16, height: 16 }}>{I.plus}</div>
        <span>Log workout</span>
      </div>
    </div>
    <TabBar active="workouts" />
    <HomeIndicator />
  </>
);

const Workouts_TypeSelect = () => {
  const tiles = [
    ['gym', 'Gym'],
    ['run', 'Run'],
    ['bike', 'Ride'],
    ['swim', 'Swim'],
    ['sport', 'Sport'],
    ['walk', 'Walk'],
  ];
  return (
    <>
      {/* dim bg */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-warm)', opacity: 1 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <StatusBar />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 130, background: 'var(--bg-warm)', borderRadius: '20px 20px 0 0', border: '1px solid var(--border)', borderBottom: 'none', padding: '12px 20px 18px', display: 'flex', flexDirection: 'column', zIndex: 2 }}>
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border-hi)', alignSelf: 'center', marginBottom: 18 }} />
        <h1 className="display" style={{ fontSize: 24, margin: 0, marginBottom: 6, lineHeight: 1.15 }}>What did you <em>do</em>?</h1>
        <p className="t2" style={{ margin: 0, marginBottom: 18, fontSize: 12.5 }}>Pick a type — we'll handle the details.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {tiles.map(([k, n]) => (
            <div key={n} className="card-2" style={{ padding: 14, height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 14 }}>
              <div style={{ width: 22, height: 22, color: 'var(--text-2)' }}>{I[k]}</div>
              <div className="display" style={{ fontSize: 16 }}>{n}</div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-block" style={{ fontSize: 12.5 }}>Cancel</button>
      </div>
      <HomeIndicator />
    </>
  );
};

const Workouts_GymDetail = () => (
  <>
    <StatusBar />
    <div className="screen-body screen-pad">
      <div className="between" style={{ marginTop: 4, marginBottom: 18 }}>
        <span className="row" style={{ gap: 6 }}>
          <div style={{ width: 16, height: 16, color: 'var(--text-2)' }}>{I.arrowL}</div>
          <span className="mono">Gym session</span>
        </span>
        <span className="mono lime">Save</span>
      </div>
      <input className="input" defaultValue="Push day" style={{ marginBottom: 12, fontFamily: 'var(--display)', fontSize: 20, height: 56 }} />
      <div className="row" style={{ gap: 10, marginBottom: 18 }}>
        <div className="card-2" style={{ padding: 12, flex: 1 }}>
          <div className="mono" style={{ marginBottom: 4 }}>Duration</div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>62<span style={{ fontSize: 11, color: 'var(--text-3)' }}> min</span></div>
        </div>
        <div className="card-2" style={{ padding: 12, flex: 1 }}>
          <div className="mono" style={{ marginBottom: 4 }}>Started</div>
          <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>11:28<span style={{ fontSize: 11, color: 'var(--text-3)' }}> am</span></div>
        </div>
      </div>
      <div className="between" style={{ marginBottom: 8 }}>
        <span className="mono">Exercises · 4</span>
        <span className="mono lime">Reorder</span>
      </div>
      <div className="stack" style={{ gap: 8, marginBottom: 12 }}>
        {[
          ['Bench press', '4 sets', '5 / 5 / 4 / 4', '80 kg'],
          ['Incline DB press', '3 sets', '10 / 10 / 8', '30 kg'],
          ['Cable fly', '3 sets', '12 / 12 / 12', '15 kg'],
          ['Tricep pushdown', '4 sets', '15 / 12 / 12 / 10', '32 kg'],
        ].map(([n, s, r, w], i) => (
          <div key={i} className="card" style={{ padding: 12, borderColor: i===0 ? 'var(--border-hi)' : 'var(--border)' }}>
            <div className="between" style={{ marginBottom: 4 }}>
              <div className="display" style={{ fontSize: 14.5 }}>{n}</div>
              <span className="mono">{s}</span>
            </div>
            <div className="row" style={{ gap: 12, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-2)', letterSpacing: '0.06em' }}>
              <span>{r}</span>
              <span className="t3">·</span>
              <span className="lime">{w}</span>
            </div>
          </div>
        ))}
        <div className="card" style={{ padding: 14, border: '1px dashed var(--border-hi)', background: 'transparent', textAlign: 'center', color: 'var(--text-3)', fontSize: 12.5 }}>
          + Add exercise
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary btn-block" style={{ marginBottom: 14 }}>Save workout</button>
    </div>
    <HomeIndicator />
  </>
);

/* ========= Section 8 — You ========= */

const You_Main = () => (
  <>
    <StatusBar />
    <div className="screen-body">
      <div className="screen-pad">
        <div className="row" style={{ marginTop: 6, marginBottom: 16, gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #2a2722, #14130f)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
            <span className="display" style={{ fontSize: 22, fontStyle: 'italic' }}>A</span>
          </div>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 19, lineHeight: 1.1 }}>Alex Rivera</div>
            <div className="mono" style={{ marginTop: 4 }}>Member since Nov 2025</div>
          </div>
        </div>
        <div className="card-2" style={{ padding: 14, marginBottom: 20 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>76.4<span style={{ fontSize: 11, color: 'var(--text-3)' }}> kg</span></div>
              <div className="mono" style={{ marginTop: 4 }}>Current</div>
            </div>
            <div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1, color: 'var(--accent)' }}>↓ 2.4<span style={{ fontSize: 11 }}> kg</span></div>
              <div className="mono" style={{ marginTop: 4 }}>14 days</div>
            </div>
            <div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>14<span style={{ fontSize: 11, color: 'var(--text-3)' }}> days</span></div>
              <div className="mono" style={{ marginTop: 4 }}>Streak</div>
            </div>
          </div>
        </div>
        <div className="stack">
          {[
            ['Goals & targets', null],
            ['Activities', '3 selected'],
            ['Connected apps', 'Apple Health · Strava'],
            ['Notifications', null],
            ['Theme', 'Dark'],
            ['Units', 'Metric'],
            ['Privacy', null],
            ['Help & support', null],
          ].map(([n, sub], i) => (
            <div key={i} className="row" style={{ padding: '14px 0', borderTop: '1px solid var(--border)', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 13.5 }}>{n}</span>
              {sub && <span className="mono" style={{ color: 'var(--text-3)' }}>{sub}</span>}
              <div style={{ width: 14, height: 14, color: 'var(--text-3)' }}>{I.chevR}</div>
            </div>
          ))}
          <div className="row" style={{ padding: '14px 0', borderTop: '1px solid var(--border)' }}>
            <span style={{ flex: 1, fontSize: 13.5, color: 'var(--danger)' }}>Sign out</span>
          </div>
        </div>
      </div>
    </div>
    <TabBar active="you" />
    <HomeIndicator />
  </>
);

const You_Weight = () => {
  // line chart points — 30 days, descending trend
  const pts = [78.8,78.6,78.7,78.4,78.2,78.3,78.0,77.8,77.9,77.6,77.4,77.5,77.2,77.0,77.1,76.9,76.8,76.9,76.6,76.7,76.5,76.4,76.3,76.5,76.4,76.2,76.4,76.3,76.4,76.4];
  const w = 250, h = 110, padX = 6, padY = 8;
  const min = 75.5, max = 79;
  const xs = pts.map((_, i) => padX + (i/(pts.length-1)) * (w - padX*2));
  const ys = pts.map(v => padY + (1 - (v - min)/(max - min)) * (h - padY*2));
  const d = xs.map((x, i) => `${i===0?'M':'L'} ${x} ${ys[i]}`).join(' ');
  return (
    <>
      <StatusBar />
      <div className="screen-body screen-pad">
        <div className="between" style={{ marginTop: 4, marginBottom: 18 }}>
          <span className="row" style={{ gap: 6 }}>
            <div style={{ width: 16, height: 16, color: 'var(--text-2)' }}>{I.arrowL}</div>
            <span className="mono">Weight</span>
          </span>
          <span className="mono lime">+ Log</span>
        </div>
        <div className="row" style={{ alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <div className="display" style={{ fontSize: 46, lineHeight: 1 }}>76.4 <span style={{ fontSize: 18, color: 'var(--text-3)' }}>kg</span></div>
        </div>
        <div className="row" style={{ gap: 8, marginBottom: 22 }}>
          <span className="pill" style={{ padding: '4px 10px' }}>↓ 2.4 kg</span>
          <span className="mono">in 14 days</span>
        </div>
        <div className="row" style={{ gap: 6, marginBottom: 14, fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {[['1W',false],['1M',true],['3M',false],['1Y',false],['ALL',false]].map(([l,a]) => (
            <span key={l} style={{ padding: '6px 11px', borderRadius: 8, background: a ? 'var(--surface-2)' : 'transparent', color: a ? 'var(--accent)' : 'var(--text-3)', border: a ? '1px solid var(--border)' : '1px solid transparent' }}>{l}</span>
          ))}
        </div>
        <div className="card-2" style={{ padding: '14px 12px', marginBottom: 16 }}>
          <svg width={w} height={h} style={{ display: 'block', width: '100%' }} viewBox={`0 0 ${w} ${h}`}>
            {[0,1,2,3].map(i => (
              <line key={i} x1={padX} x2={w-padX} y1={padY + i*((h-padY*2)/3)} y2={padY + i*((h-padY*2)/3)} stroke="var(--border)" strokeDasharray="2 4" />
            ))}
            <path d={d} fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            {/* tooltip dot */}
            <circle cx={xs[21]} cy={ys[21]} r="3.5" fill="var(--accent)" stroke="var(--bg-warm)" strokeWidth="2" />
            <line x1={xs[21]} x2={xs[21]} y1={padY} y2={h-padY} stroke="var(--border-hi)" strokeDasharray="2 2" />
          </svg>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 10, fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-3)', letterSpacing: '0.08em' }}>
            <span>Oct 20</span><span>Nov 5</span><span>Today</span>
          </div>
        </div>
        {/* tooltip card */}
        <div className="card" style={{ padding: 12, marginBottom: 14 }}>
          <div className="between">
            <span className="mono">Nov 11 · Tue</span>
            <span className="display" style={{ fontSize: 17 }}>76.5 <span style={{ fontSize: 10, color: 'var(--text-3)' }}>kg</span></span>
          </div>
        </div>
        <div className="mono" style={{ marginBottom: 8 }}>Recent entries</div>
        {[['Today','7:02 AM','76.4'],['Yesterday','6:58 AM','76.5'],['Mon','7:14 AM','76.6']].map(([d, t, w], i) => (
          <div key={i} className="row" style={{ padding: '10px 0', borderTop: '1px solid var(--border)', gap: 8 }}>
            <span style={{ flex: 1, fontSize: 13 }}>{d}</span>
            <span className="mono" style={{ color: 'var(--text-3)' }}>{t}</span>
            <span className="display" style={{ fontSize: 14 }}>{w} <span style={{ fontSize: 10, color: 'var(--text-3)' }}>kg</span></span>
          </div>
        ))}
      </div>
      <HomeIndicator />
    </>
  );
};

Object.assign(window, { Workouts_Main, Workouts_TypeSelect, Workouts_GymDetail, You_Main, You_Weight });
