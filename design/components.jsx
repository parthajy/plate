/* === Shared atoms for Plate gallery === */
/* global React */

const StatusBar = ({ light = false }) => (
  <div className="status-bar" style={light ? { color: '#f6f3e9' } : {}}>
    <span>9:41</span>
    <div className="right">
      {/* signal */}
      <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor"><rect x="0" y="6" width="3" height="4" rx="0.5"/><rect x="4" y="4" width="3" height="6" rx="0.5"/><rect x="8" y="2" width="3" height="8" rx="0.5"/><rect x="12" y="0" width="3" height="10" rx="0.5"/></svg>
      {/* wifi */}
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M1 3.5 C 3.5 1, 10.5 1, 13 3.5"/><path d="M3 5.5 C 4.7 4, 9.3 4, 11 5.5"/><path d="M5 7.5 C 5.8 6.7, 8.2 6.7, 9 7.5"/><circle cx="7" cy="9" r="0.6" fill="currentColor"/></svg>
      {/* battery */}
      <svg width="22" height="10" viewBox="0 0 22 10" fill="none"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor" opacity="0.6"/><rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor"/><rect x="19.5" y="3.5" width="1.5" height="3" rx="0.5" fill="currentColor" opacity="0.6"/></svg>
    </div>
  </div>
);

const HomeIndicator = ({ dark }) => (
  <div className="home-indicator" style={dark ? { background: 'rgba(0,0,0,0.4)' } : {}} />
);

/* === Lucide-style stroked icons (2px) === */
const I = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 L12 3 l9 7.5 V20 a1 1 0 0 1 -1 1 h-5 v-7 h-6 v7 h-5 a1 1 0 0 1 -1 -1 Z"/></svg>,
  spark: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 v5 M12 16 v5 M3 12 h5 M16 12 h5 M5.6 5.6 l3.5 3.5 M14.9 14.9 l3.5 3.5 M5.6 18.4 l3.5 -3.5 M14.9 9.1 l3.5 -3.5"/></svg>,
  scan: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8 V5 a1 1 0 0 1 1 -1 h3 M16 4 h3 a1 1 0 0 1 1 1 v3 M20 16 v3 a1 1 0 0 1 -1 1 h-3 M8 20 H5 a1 1 0 0 1 -1 -1 v-3 M8 12 h8"/></svg>,
  dumb: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12 h2 M20 12 h2 M5 9 v6 M19 9 v6 M8 7 v10 M16 7 v10 M8 12 h8"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21 c0 -4.4 3.6 -8 8 -8 s8 3.6 8 8"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5 v14 M5 12 h14"/></svg>,
  arrowR: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12 h14 M13 6 l6 6 -6 6"/></svg>,
  arrowL: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12 H5 M11 6 l-6 6 6 6"/></svg>,
  arrowUp: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19 V5 M6 11 l6 -6 6 6"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12 l5 5 L20 6"/></svg>,
  gym: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12 h2 M20 12 h2 M5 8 v8 M19 8 v8 M8 6 v12 M16 6 v12 M8 12 h8"/></svg>,
  run: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="2"/><path d="M4 22 l3 -7 4 -2 -3 -4 4 -3 4 5 4 1 M11 13 l1 4 4 5"/></svg>,
  bike: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="17" r="4"/><circle cx="18" cy="17" r="4"/><circle cx="15" cy="4" r="1.5"/><path d="M6 17 l4 -7 h5 l3 7 M10 10 l-2 -3 h-3"/></svg>,
  swim: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M2 17 c2 -1.5 4 -1.5 6 0 s4 1.5 6 0 s4 -1.5 6 0 M2 21 c2 -1.5 4 -1.5 6 0 s4 1.5 6 0 s4 -1.5 6 0 M6 11 l5 5 M11 6 l5 5 M17 4 a2 2 0 1 0 0 0.1"/></svg>,
  sport: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12 c4 -1.5 14 -1.5 18 0 M12 3 c -1.5 4 -1.5 14 0 18 M12 3 c 1.5 4 1.5 14 0 18 M3 12 c4 1.5 14 1.5 18 0"/></svg>,
  yoga: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7 v6 M4 11 c3 0 5 1 8 2 c3 -1 5 -2 8 -2 M9 21 l3 -8 3 8"/></svg>,
  walk: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4" r="2"/><path d="M7 22 l3 -8 l-2 -3 l3 -3 l3 4 l3 1 M10 14 l3 8"/></svg>,
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>,
  scale: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 16 a3 3 0 0 1 6 0 M12 9 v4 M10 7 h4"/></svg>,
  rebuild: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12 a9 9 0 1 1 -3 -6.7 M21 4 v5 h-5"/></svg>,
  flame: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22 c4 0 7 -3 7 -7 c0 -4 -3 -6 -4 -10 c-3 4 -10 5 -10 12 c0 3.5 3 5 7 5 Z M12 22 c -2 0 -4 -1.5 -4 -4 c0 -2 1.5 -3 3 -5 c0 2 2 2.5 2 5 c0 2 -1 4 -1 4"/></svg>,
  send: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12 L21 4 l-7 17 -3 -8 -8 -1 Z"/></svg>,
  mic: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11 a7 7 0 0 0 14 0 M12 18 v3 M9 21 h6"/></svg>,
  chevR: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 l6 6 -6 6"/></svg>,
  chevD: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9 l6 6 6 -6"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21 l-5 -5"/></svg>,
  minus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12 h14"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6 l12 12 M18 6 l-12 12"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M6 17 V11 a6 6 0 1 1 12 0 v6 l2 3 H4 Z M10 21 a2 2 0 0 0 4 0"/></svg>,
  apple: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.2 13.4 c0 -2.6 2.1 -3.8 2.2 -3.9 c-1.2 -1.7 -3 -2 -3.7 -2 c-1.6 -0.2 -3 0.9 -3.8 0.9 c-0.8 0 -2 -0.9 -3.3 -0.9 c-1.7 0 -3.3 1 -4.2 2.5 c-1.8 3.1 -0.5 7.7 1.3 10.3 c0.9 1.2 1.9 2.6 3.3 2.5 c1.3 -0.1 1.8 -0.8 3.4 -0.8 c1.6 0 2.1 0.8 3.4 0.8 c1.4 0 2.3 -1.2 3.2 -2.5 c1 -1.4 1.4 -2.8 1.5 -2.9 c-0.1 0 -2.9 -1.1 -2.9 -4.4 z M14.6 5.7 c0.7 -0.9 1.2 -2.1 1.1 -3.4 c-1 0 -2.3 0.7 -3 1.5 c-0.7 0.8 -1.3 2 -1.1 3.2 c1.2 0.1 2.4 -0.6 3 -1.3 z"/></svg>,
  google: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 12.2 c0 -0.7 -0.1 -1.4 -0.2 -2 H12 v3.9 h5.4 c -0.2 1.2 -0.9 2.3 -2 3 v2.5 h3.2 c1.9 -1.7 3 -4.3 3 -7.4 z M12 22 c2.7 0 5 -0.9 6.6 -2.4 l -3.2 -2.5 c -0.9 0.6 -2 1 -3.4 1 c -2.6 0 -4.8 -1.8 -5.6 -4.1 H3.1 v2.6 C4.8 19.9 8.2 22 12 22 z M6.4 14 c -0.2 -0.6 -0.3 -1.3 -0.3 -2 s0.1 -1.4 0.3 -2 V7.4 H3.1 C2.4 8.8 2 10.4 2 12 s0.4 3.2 1.1 4.6 L6.4 14 z M12 5.9 c1.5 0 2.8 0.5 3.8 1.5 l2.8 -2.8 C16.9 3 14.7 2 12 2 C8.2 2 4.8 4.1 3.1 7.4 L6.4 10 C7.2 7.7 9.4 5.9 12 5.9 z"/></svg>,
  camera: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8 a2 2 0 0 1 2 -2 h2 l2 -2 h6 l2 2 h2 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 Z"/><circle cx="12" cy="13" r="4"/></svg>,
  timer: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="14" r="8"/><path d="M9 2 h6 M12 14 V10"/></svg>,
};

/* Ring component — calorie display */
const Ring = ({ size = 116, value = 0, max = 100, color = 'var(--accent)', strokeW = 7, label, sub }) => {
  const r = (size - strokeW) / 2;
  const c = 2 * Math.PI * r;
  const off = c - Math.min(value / max, 1) * c;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={strokeW} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={strokeW} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <div className="ring-center">{label}{sub && <div style={{marginTop:2}}>{sub}</div>}</div>
    </div>
  );
};

/* Tab bar — consistent across main screens */
const TabBar = ({ active = 'today' }) => (
  <div className="tabbar">
    <div className="tabbar-line" />
    <div className={`tab ${active==='today'?'active':''}`}>{I.home}<span className="tab-label">Today</span></div>
    <div className={`tab ${active==='coach'?'active':''}`}>{I.spark}<span className="tab-label">Coach</span></div>
    <div className="tab-scan">{I.scan}</div>
    <div className={`tab ${active==='workouts'?'active':''}`}>{I.dumb}<span className="tab-label">Workouts</span></div>
    <div className={`tab ${active==='you'?'active':''}`}>{I.user}<span className="tab-label">You</span></div>
  </div>
);

/* Macro bar */
const MacroBar = ({ pct, color }) => (
  <div className="macro-bar"><div style={{ width: `${pct}%`, background: color }} /></div>
);

/* Phone frame wrapper */
const Phone = ({ children, rot, cnum, title, note, dark }) => (
  <div className={`phone-wrap rot-${rot}`}>
    <div className="phone">
      <div className="phone-screen">
        <div className="notch" />
        {children}
      </div>
    </div>
    <div className="caption">
      <span className="cnum">{cnum}</span>
      <div>
        <div className="ctitle">{title}</div>
        <div className="cnote">{note}</div>
      </div>
    </div>
  </div>
);

/* Section header */
const Section = ({ num, title, desc, children }) => (
  <section className="section">
    <div className="section-head">
      <div className="section-num">§ {num}</div>
      <div>
        <h2 className="section-title" dangerouslySetInnerHTML={{__html: title}} />
        <p className="section-desc">{desc}</p>
      </div>
    </div>
    <div className="gallery">{children}</div>
  </section>
);

Object.assign(window, { StatusBar, HomeIndicator, I, Ring, TabBar, MacroBar, Phone, Section });
