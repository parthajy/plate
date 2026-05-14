/* === Section 2 — Today (2.1 – 2.4) === */
/* global React, StatusBar, HomeIndicator, I, Ring, TabBar, MacroBar */

const MealRow = ({ name, kind, time, kcal }) => (
  <div className="row" style={{ gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div className="display" style={{ fontSize: 13, color: 'var(--text-2)' }}>{kind[0]}</div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13.5, lineHeight: 1.2, marginBottom: 3 }}>{name}</div>
      <div className="mono">{kind} · {time}</div>
    </div>
    <div className="display" style={{ fontSize: 17 }}>{kcal}<span style={{ fontSize: 10, color: 'var(--text-3)' }}> kcal</span></div>
  </div>
);

const Today_Typical = () => (
  <>
    <StatusBar />
    <div className="screen-body">
      <div className="screen-pad">
        <div className="between" style={{ marginTop: 8, marginBottom: 22 }}>
          <h1 className="display" style={{ fontSize: 24, margin: 0, lineHeight: 1.05 }}>Afternoon, <em>Alex</em> —</h1>
          <div className="stack" style={{ alignItems: 'flex-end' }}>
            <span className="mono">Wed · Nov 19</span>
            <span className="mono lime" style={{ marginTop: 2 }}>Day 14</span>
          </div>
        </div>
        <div className="row" style={{ gap: 16, marginBottom: 20 }}>
          <Ring size={116} value={1247} max={2400} strokeW={6} label={
            <div>
              <div className="display" style={{ fontSize: 26, lineHeight: 1 }}>1,247</div>
              <div className="mono" style={{ marginTop: 4 }}>of 2,400</div>
            </div>
          } />
          <div style={{ flex: 1 }}>
            <span className="pill"><span className="dot" />↑ on pace</span>
            <div className="display" style={{ fontSize: 16, lineHeight: 1.2, marginTop: 8, color: 'var(--text)' }}>
              1,153 left.
            </div>
            <div className="t2" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>
              Hit your protein, hit the gym.
            </div>
          </div>
        </div>
        {/* macro row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
          {[
            ['Protein', 128, 180, 'var(--accent)'],
            ['Carbs', 142, 260, 'var(--accent-2)'],
            ['Fat', 38, 70, 'var(--amber)'],
          ].map(([n, v, m, c]) => (
            <div key={n} className="card" style={{ padding: 10 }}>
              <div className="mono" style={{ color: c, marginBottom: 4 }}>{n}</div>
              <div className="display" style={{ fontSize: 18, lineHeight: 1 }}>{v}<span style={{ fontSize: 10, color: 'var(--text-3)' }}>/{m}g</span></div>
              <div style={{ marginTop: 8 }}><MacroBar pct={Math.round((v/m)*100)} color={c} /></div>
              <div className="mono" style={{ marginTop: 4 }}>{Math.round((v/m)*100)}%</div>
            </div>
          ))}
        </div>
        <div className="between" style={{ marginBottom: 4 }}>
          <span className="mono">Today's intake · 3 entries</span>
          <span className="mono lime">+ Add</span>
        </div>
        <MealRow name="Oats, berries & whey" kind="Breakfast" time="7:30" kcal={420} />
        <MealRow name="Banana + peanut butter" kind="Snack" time="10:15" kcal={280} />
        <MealRow name="Chicken & rice bowl" kind="Lunch" time="12:45" kcal={547} />
      </div>
    </div>
    <TabBar active="today" />
    <HomeIndicator />
  </>
);

const Today_Empty = () => (
  <>
    <StatusBar />
    <div className="screen-body">
      <div className="screen-pad">
        <div className="between" style={{ marginTop: 8, marginBottom: 24 }}>
          <h1 className="display" style={{ fontSize: 24, margin: 0, lineHeight: 1.05 }}>Morning, <em>Alex</em> —</h1>
          <div className="stack" style={{ alignItems: 'flex-end' }}>
            <span className="mono">Wed · Nov 19</span>
            <span className="mono lime" style={{ marginTop: 2 }}>Day 14</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <Ring size={140} value={0} max={2400} strokeW={6} label={
            <div>
              <div className="display" style={{ fontSize: 32, lineHeight: 1 }}>0</div>
              <div className="mono" style={{ marginTop: 4 }}>of 2,400</div>
            </div>
          } />
        </div>
        <div className="display" style={{ fontSize: 22, textAlign: 'center', marginBottom: 16, lineHeight: 1.15, fontStyle: 'italic' }}>
          <span style={{ color: 'var(--accent)' }}>Fresh day.</span><br/>What's for breakfast?
        </div>
        <button className="btn btn-primary btn-block" style={{ marginBottom: 22 }}>Log breakfast</button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {['Protein', 'Carbs', 'Fat'].map((n, i) => (
            <div key={n} className="card" style={{ padding: 10 }}>
              <div className="mono" style={{ color: ['var(--accent)','var(--accent-2)','var(--amber)'][i], marginBottom: 4 }}>{n}</div>
              <div className="display" style={{ fontSize: 18, lineHeight: 1, color: 'var(--text-3)' }}>0<span style={{ fontSize: 10 }}>/{[180,260,70][i]}g</span></div>
              <div style={{ marginTop: 8 }}><MacroBar pct={0} color="var(--accent)" /></div>
              <div className="mono" style={{ marginTop: 4 }}>0%</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div className="plate"></div>
          <div className="mono" style={{ color: 'var(--text-3)', marginTop: 8 }}>No meals yet</div>
        </div>
      </div>
    </div>
    <TabBar active="today" />
    <HomeIndicator />
  </>
);

const Today_Over = () => (
  <>
    <StatusBar />
    <div className="screen-body">
      <div className="screen-pad">
        <div className="between" style={{ marginTop: 8, marginBottom: 22 }}>
          <h1 className="display" style={{ fontSize: 24, margin: 0, lineHeight: 1.05 }}>Evening, <em>Alex</em> —</h1>
          <div className="stack" style={{ alignItems: 'flex-end' }}>
            <span className="mono">Wed · Nov 19</span>
            <span className="mono" style={{ marginTop: 2, color: 'var(--warn)' }}>Day 14</span>
          </div>
        </div>
        <div className="row" style={{ gap: 16, marginBottom: 18 }}>
          <Ring size={116} value={1} max={1} color="var(--warn)" strokeW={6} label={
            <div>
              <div className="display" style={{ fontSize: 26, lineHeight: 1 }}>2,580</div>
              <div className="mono" style={{ marginTop: 4, color: 'var(--warn)' }}>of 2,400</div>
            </div>
          } />
          <div style={{ flex: 1 }}>
            <span className="pill warn"><span className="dot" />↗ over by 180</span>
            <div className="display" style={{ fontSize: 16, lineHeight: 1.2, marginTop: 8, color: 'var(--text)' }}>
              Still fine.
            </div>
            <div className="t2" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>
              Average over the week is what counts.
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
          {[
            ['Protein', 182, 180, 'var(--accent)'],
            ['Carbs', 298, 260, 'var(--accent-2)'],
            ['Fat', 92, 70, 'var(--amber)'],
          ].map(([n, v, m, c], i) => (
            <div key={n} className="card" style={{ padding: 10 }}>
              <div className="mono" style={{ color: c, marginBottom: 4 }}>{n}</div>
              <div className="display" style={{ fontSize: 18, lineHeight: 1 }}>{v}<span style={{ fontSize: 10, color: 'var(--text-3)' }}>/{m}g</span></div>
              <div style={{ marginTop: 8 }}><MacroBar pct={100} color={i===0?c:'var(--warn)'} /></div>
              <div className="mono" style={{ marginTop: 4, color: i===0?'var(--good)':'var(--warn)' }}>{i===0?'✓ hit':`+${v-m}g`}</div>
            </div>
          ))}
        </div>
        <div className="between" style={{ marginBottom: 4 }}>
          <span className="mono">Today's intake · 5 entries</span>
        </div>
        <MealRow name="Oats, berries & whey" kind="Breakfast" time="7:30" kcal={420} />
        <MealRow name="Chicken & rice bowl" kind="Lunch" time="12:45" kcal={547} />
        <MealRow name="Tonkotsu ramen" kind="Dinner" time="19:30" kcal={890} />
      </div>
    </div>
    <TabBar active="today" />
    <HomeIndicator />
  </>
);

const Today_Past = () => (
  <>
    <StatusBar />
    <div className="screen-body">
      <div className="screen-pad">
        <div className="between" style={{ marginTop: 8, marginBottom: 12 }}>
          <h1 className="display" style={{ fontSize: 22, margin: 0, lineHeight: 1.05 }}>Looking back</h1>
          <span className="mono lime">View past days →</span>
        </div>
        <div className="daystrip" style={{ marginBottom: 18 }}>
          {['M','T','W','T','F','S','S'].map((l, i) => {
            const isToday = i === 2;
            const active = i === 1;
            return (
              <div key={i} className={`day ${active?'active':''}`} style={{ opacity: i>2 ? 0.4 : 1 }}>
                <span className="d">{l}</span>
                <span className="n">{17+i}</span>
              </div>
            );
          })}
        </div>
        <div className="between" style={{ marginBottom: 16 }}>
          <span className="mono">Tue · Nov 18</span>
          <span className="pill good"><span className="dot" />on target</span>
        </div>
        <div className="row" style={{ gap: 16, marginBottom: 18 }}>
          <Ring size={108} value={2310} max={2400} strokeW={6} label={
            <div>
              <div className="display" style={{ fontSize: 22, lineHeight: 1 }}>2,310</div>
              <div className="mono" style={{ marginTop: 4 }}>of 2,400</div>
            </div>
          } />
          <div style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
            Closed −90 kcal under. 4 meals logged. Trained legs at 6pm.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            ['Protein', 178, 180, 'var(--accent)'],
            ['Carbs', 244, 260, 'var(--accent-2)'],
            ['Fat', 64, 70, 'var(--amber)'],
          ].map(([n, v, m, c]) => (
            <div key={n} className="card" style={{ padding: 10 }}>
              <div className="mono" style={{ color: c, marginBottom: 4 }}>{n}</div>
              <div className="display" style={{ fontSize: 18, lineHeight: 1 }}>{v}<span style={{ fontSize: 10, color: 'var(--text-3)' }}>/{m}g</span></div>
              <div style={{ marginTop: 8 }}><MacroBar pct={Math.round((v/m)*100)} color={c} /></div>
            </div>
          ))}
        </div>
        <MealRow name="Overnight oats" kind="Breakfast" time="7:10" kcal={380} />
        <MealRow name="Tuna wrap" kind="Lunch" time="13:00" kcal={520} />
      </div>
    </div>
    <TabBar active="today" />
    <HomeIndicator />
  </>
);

Object.assign(window, { Today_Typical, Today_Empty, Today_Over, Today_Past });
