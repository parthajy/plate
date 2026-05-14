/* === Section 6 — Pantry → Recipe (6.1 – 6.3) === */
/* global React, StatusBar, HomeIndicator, I, TabBar */

const Pantry_List = () => {
  const ing = ['🍗 Chicken','🍚 Rice','🥦 Broccoli','🧄 Garlic','🥚 Eggs','🧅 Onion','🌶️ Chili','🍋 Lemon','🥑 Avocado','🍞 Bread','🧀 Cheese','🥕 Carrot'];
  return (
    <>
      <StatusBar />
      <div className="screen-body">
        <div className="screen-pad">
          <div className="row" style={{ marginTop: 4, marginBottom: 16, gap: 6 }}>
            <div style={{ width: 16, height: 16, color: 'var(--text-2)' }}>{I.arrowL}</div>
            <span className="mono">Pantry</span>
          </div>
          <h1 className="display" style={{ fontSize: 24, margin: 0, marginBottom: 6, lineHeight: 1.1 }}>
            Got these. <em>Make me</em> something.
          </h1>
          <p className="t2" style={{ margin: 0, marginBottom: 18, fontSize: 12.5 }}>12 ingredients on hand. Tap one to remove.</p>
          <div className="row" style={{ gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="chip active" style={{ padding: '6px 10px', fontSize: 11 }}>&lt; 30 min</div>
            <div className="chip active" style={{ padding: '6px 10px', fontSize: 11 }}>High protein</div>
            <div className="chip" style={{ padding: '6px 10px', fontSize: 11 }}>Low carb</div>
            <div className="chip" style={{ padding: '6px 10px', fontSize: 11 }}>Veggie</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {ing.map(s => (
              <div key={s} className="chip" style={{ padding: '8px 11px', fontSize: 12, background: 'var(--surface-2)' }}>{s}</div>
            ))}
            <div className="chip" style={{ padding: '8px 11px', fontSize: 12, border: '1px dashed var(--border-hi)', background: 'transparent', color: 'var(--text-3)' }}>+ Add</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div className="screen-pad" style={{ paddingBottom: 90 }}>
          <button className="btn btn-primary btn-block">Generate recipe {I.arrowR}</button>
        </div>
      </div>
      <TabBar active="coach" />
      <HomeIndicator />
    </>
  );
};

const Recipe_Bowl = ({ size = 100 }) => (
  <div style={{ width: size, height: size, position: 'relative', margin: '0 auto' }}>
    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #2a2722 0%, #1a1814 60%, #0e0d0b 100%)', border: '1px solid #3a3830' }} />
    <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '1px solid rgba(246,243,233,0.06)' }} />
    <div style={{ position: 'absolute', width: 46, height: 28, borderRadius: '50%', bottom: 20, right: 14, background: '#e8dec6' }} />
    <div style={{ position: 'absolute', width: 34, height: 22, borderRadius: '60% 50% 50% 60%', top: 22, left: 22, background: 'linear-gradient(135deg, #d99962, #a8623a)' }} />
    <div style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', bottom: 28, left: 22, background: '#5a8a3f' }} />
    <div style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', bottom: 40, left: 30, background: '#6c9c50' }} />
    <div style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', top: 36, right: 26, background: 'var(--accent-2)' }} />
  </div>
);

const Recipe_Generated = () => (
  <>
    <StatusBar />
    <div className="screen-body">
      <div className="screen-pad">
        <div className="between" style={{ marginTop: 4, marginBottom: 14 }}>
          <span className="row" style={{ gap: 6 }}>
            <div style={{ width: 16, height: 16, color: 'var(--text-2)' }}>{I.arrowL}</div>
            <span className="mono">Recipe · Generated</span>
          </span>
          <span className="pill"><span className="dot" />AI</span>
        </div>
        <h1 className="display" style={{ fontSize: 22, margin: 0, marginBottom: 8, lineHeight: 1.15 }}>
          Garlic-chili chicken<br /><em>rice bowl</em>
        </h1>
        <div className="row" style={{ gap: 12, marginBottom: 14, fontFamily: 'var(--mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-2)' }}>
          <span>24 min</span><span className="t3">·</span>
          <span><span className="lime">38g</span> p</span><span className="t3">·</span>
          <span>520 kcal</span>
        </div>
        <div className="card-2" style={{ padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Recipe_Bowl size={80} />
          <div style={{ flex: 1 }}>
            <div className="mono" style={{ marginBottom: 6 }}>Uses</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>4 of 12 in pantry</div>
            <div className="row" style={{ gap: 4, marginTop: 6, fontSize: 13 }}>🍗 🍚 🥦 🧄 🌶️</div>
          </div>
        </div>
        <div className="mono" style={{ marginBottom: 8 }}>Ingredients</div>
        <div className="stack" style={{ gap: 6, marginBottom: 14 }}>
          {[
            ['Chicken breast', '200 g'],
            ['Jasmine rice', '80 g dry'],
            ['Broccoli', '1 cup'],
            ['Garlic', '3 cloves'],
            ['Chili flakes', '1 tsp'],
          ].map(([n, q], i) => (
            <div key={i} className="row" style={{ gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid var(--border-hi)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13 }}>{n}</span>
              <span className="mono" style={{ color: 'var(--text-2)' }}>{q}</span>
            </div>
          ))}
        </div>
        <div className="mono" style={{ marginBottom: 8 }}>Method</div>
        <div className="stack" style={{ gap: 10, marginBottom: 18 }}>
          {[
            'Rinse rice. Bring to boil with 160ml water. Simmer covered 12 min.',
            'Slice chicken into strips. Season with salt + pepper.',
            'Sear chicken in a hot pan, 3 min per side. Don\'t crowd it.',
            'Add minced garlic + chili. Toss broccoli in. 2 min.',
            'Plate rice, top with chicken & broccoli. Squeeze lemon.',
          ].map((s, i) => (
            <div key={i} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
              <span className="mono" style={{ color: 'var(--accent)', minWidth: 16, paddingTop: 2 }}>{String(i+1).padStart(2,'0')}</span>
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="screen-pad" style={{ paddingBottom: 90, paddingTop: 4, background: 'linear-gradient(180deg, rgba(16,15,13,0) 0%, var(--bg-warm) 30%)' }}>
        <button className="btn btn-primary btn-block" style={{ marginBottom: 8 }}>Start cooking {I.arrowR}</button>
        <button className="btn btn-ghost btn-block" style={{ fontSize: 12.5 }}>Log as meal</button>
      </div>
    </div>
    <HomeIndicator />
  </>
);

const Recipe_Cooking = () => (
  <>
    <StatusBar />
    <div className="screen-body screen-pad">
      <div className="between" style={{ marginTop: 4, marginBottom: 22 }}>
        <span className="row" style={{ gap: 6 }}>
          <div style={{ width: 16, height: 16, color: 'var(--text-2)' }}>{I.arrowL}</div>
          <span className="mono">Back</span>
        </span>
        <span className="mono">Step 3 of 5</span>
      </div>
      {/* progress dots */}
      <div className="row" style={{ gap: 6, marginBottom: 30 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= 3 ? 'var(--accent)' : 'var(--surface-2)' }} />
        ))}
      </div>
      <h1 className="display" style={{ fontSize: 28, margin: 0, marginBottom: 28, lineHeight: 1.2 }}>
        Sear chicken in a hot pan, <em>3 min per side</em>. Don't crowd it.
      </h1>
      {/* timer */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <div className="ring" style={{ width: 150, height: 150 }}>
          <svg width="150" height="150">
            <circle cx="75" cy="75" r="68" fill="none" stroke="var(--surface-2)" strokeWidth="5" />
            <circle cx="75" cy="75" r="68" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeDasharray="427" strokeDashoffset="170" transform="rotate(-90 75 75)" />
          </svg>
          <div className="ring-center">
            <div className="mono" style={{ marginBottom: 4 }}>Side 1 of 2</div>
            <div className="display" style={{ fontSize: 40, lineHeight: 1, fontFamily: 'var(--mono)' }}>02:14</div>
          </div>
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 18, color: 'var(--text-2)' }}>⏸</span>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
          <div style={{ width: 18, height: 18 }}>{I.timer}</div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <button className="btn btn-primary btn-block" style={{ marginBottom: 8 }}>Next step {I.arrowR}</button>
      <button className="btn btn-ghost btn-block" style={{ fontSize: 12.5, marginBottom: 14 }}>← Back</button>
    </div>
    <HomeIndicator />
  </>
);

Object.assign(window, { Pantry_List, Recipe_Generated, Recipe_Cooking });
