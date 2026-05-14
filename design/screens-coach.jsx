/* === Section 5 — Coach Kai (5.1 – 5.3) === */
/* global React, StatusBar, HomeIndicator, I, TabBar */

const KaiAvatar = ({ size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #f4ff8c 0%, #dcff4f 50%, #a7c63a 100%)',
    color: '#0b0b0a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--display)',
    fontSize: size * 0.42,
    fontStyle: 'italic',
    flexShrink: 0,
    boxShadow: `0 0 ${size*0.3}px rgba(220,255,79,0.25)`,
  }}>K</div>
);

const BubbleAI = ({ children, style }) => (
  <div className="card" style={{ padding: '10px 13px', borderRadius: '4px 14px 14px 14px', maxWidth: '84%', fontSize: 13, lineHeight: 1.45, ...style }}>
    {children}
  </div>
);
const BubbleUser = ({ children }) => (
  <div style={{ padding: '10px 13px', borderRadius: '14px 4px 14px 14px', maxWidth: '78%', alignSelf: 'flex-end', background: 'var(--accent)', color: '#0b0b0a', fontSize: 13, lineHeight: 1.45 }}>
    {children}
  </div>
);

const Coach_Main = () => (
  <>
    <StatusBar />
    <div className="screen-body">
      <div className="screen-pad">
        <div className="row" style={{ gap: 10, marginTop: 4, marginBottom: 14 }}>
          <KaiAvatar size={36} />
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 16, lineHeight: 1 }}>Coach Kai</div>
            <div className="row" style={{ gap: 4, marginTop: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--good)', boxShadow: '0 0 6px var(--good)' }} />
              <span className="mono" style={{ color: 'var(--text-2)' }}>Online · knows your history</span>
            </div>
          </div>
        </div>
        <div className="hairline" />
      </div>
      <div className="scroll-area" style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="row" style={{ alignItems: 'flex-end', gap: 6 }}>
          <KaiAvatar size={22} />
          <BubbleAI>
            Morning. You crushed legs yesterday — <span className="display" style={{ fontStyle: 'italic' }}>18 working sets</span>, PR on squat. Recovery's solid.
          </BubbleAI>
        </div>
        <div className="row" style={{ alignItems: 'flex-end', gap: 6 }}>
          <div style={{ width: 22, flexShrink: 0 }} />
          <BubbleAI>
            Heads up — you're <span className="lime">52g protein</span> short for today's target. Want me to slot in a meal?
          </BubbleAI>
        </div>
        <BubbleUser>yeah, something quick</BubbleUser>
        <div className="row" style={{ alignItems: 'flex-end', gap: 6 }}>
          <KaiAvatar size={22} />
          <BubbleAI>
            <div style={{ marginBottom: 6 }}>Greek yogurt + 30g whey + frozen berries.</div>
            <div className="row" style={{ gap: 10, fontSize: 11.5, color: 'var(--text-2)' }}>
              <span><span className="lime">42g</span> protein</span>
              <span>·</span>
              <span><span className="t2">380</span> kcal</span>
              <span>·</span>
              <span>90 sec</span>
            </div>
          </BubbleAI>
        </div>
        <div className="row" style={{ gap: 6, paddingLeft: 28, flexWrap: 'wrap', marginTop: 4 }}>
          <div className="chip" style={{ borderColor: 'var(--accent)', color: 'var(--accent)', background: 'rgba(220,255,79,0.05)', padding: '7px 11px', fontSize: 11.5 }}>Log it</div>
          <div className="chip" style={{ padding: '7px 11px', fontSize: 11.5 }}>Show recipe</div>
          <div className="chip" style={{ padding: '7px 11px', fontSize: 11.5 }}>Different idea</div>
        </div>
      </div>
      {/* composer */}
      <div style={{ position: 'absolute', bottom: 76, left: 12, right: 12, padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-3)', paddingLeft: 6 }}>Ask anything…</span>
        <div style={{ width: 24, height: 24, color: 'var(--text-3)' }}>{I.mic}</div>
        <div style={{ width: 34, height: 34, borderRadius: 99, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b0b0a' }}>
          <div style={{ width: 15, height: 15 }}>{I.send}</div>
        </div>
      </div>
    </div>
    <TabBar active="coach" />
    <HomeIndicator />
  </>
);

const Coach_Tool = () => (
  <>
    <StatusBar />
    <div className="screen-body">
      <div className="screen-pad">
        <div className="row" style={{ gap: 10, marginTop: 4, marginBottom: 14 }}>
          <KaiAvatar size={36} />
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 16, lineHeight: 1 }}>Coach Kai</div>
            <div className="row" style={{ gap: 4, marginTop: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--good)', boxShadow: '0 0 6px var(--good)' }} />
              <span className="mono" style={{ color: 'var(--text-2)' }}>Online · knows your history</span>
            </div>
          </div>
        </div>
        <div className="hairline" />
      </div>
      <div className="scroll-area" style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BubbleUser>how's my week looking on protein?</BubbleUser>
        <div className="row" style={{ alignItems: 'flex-end', gap: 6 }}>
          <KaiAvatar size={22} />
          <BubbleAI>Let me check your week so far —</BubbleAI>
        </div>
        {/* tool use indicator */}
        <div className="row" style={{ gap: 8, paddingLeft: 28, paddingTop: 4 }}>
          <div className="card-2" style={{ padding: '8px 11px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', animation: 'pulse 1.4s ease-in-out infinite' }} />
            <span className="mono lime">Analyzing week</span>
            <span style={{ width: 1, height: 10, background: 'var(--border)' }} />
            <span className="mono">7 days · 28 entries</span>
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }`}</style>
        <div className="row" style={{ alignItems: 'flex-end', gap: 6, marginTop: 4 }}>
          <KaiAvatar size={22} />
          <BubbleAI>
            <div style={{ marginBottom: 8 }}>You averaged <span className="display" style={{ fontSize: 18, fontStyle: 'italic' }}>163g protein/day</span>, target was 180.</div>
            <div className="row" style={{ height: 32, alignItems: 'flex-end', gap: 3, marginBottom: 6 }}>
              {[150, 178, 142, 195, 160, 168, 148].map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${(v/200)*100}%`, background: v >= 175 ? 'var(--accent)' : 'var(--surface-2)', borderRadius: 2, border: v < 175 ? '1px solid var(--border-hi)' : 'none' }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Close, not quite. Tomorrow's a chance.</div>
          </BubbleAI>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 76, left: 12, right: 12, padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-3)', paddingLeft: 6 }}>Ask anything…</span>
        <div style={{ width: 24, height: 24, color: 'var(--text-3)' }}>{I.mic}</div>
        <div style={{ width: 34, height: 34, borderRadius: 99, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b0b0a' }}>
          <div style={{ width: 15, height: 15 }}>{I.send}</div>
        </div>
      </div>
    </div>
    <TabBar active="coach" />
    <HomeIndicator />
  </>
);

const Coach_Empty = () => (
  <>
    <StatusBar />
    <div className="screen-body">
      <div className="screen-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <KaiAvatar size={78} />
        </div>
        <h1 className="display" style={{ fontSize: 26, textAlign: 'center', margin: 0, lineHeight: 1.15, marginBottom: 8 }}>
          I'm <em>Kai</em>.<br />I'll keep you on track.
        </h1>
        <p className="t2" style={{ textAlign: 'center', fontSize: 13, margin: '0 0 22px', maxWidth: '85%', alignSelf: 'center' }}>
          Ask anything about food, training, or where you stand this week.
        </p>
        <div className="stack" style={{ gap: 8 }}>
          {[
            'What should I eat tonight?',
            'Plan my week',
            'I broke my diet, what now?',
          ].map(t => (
            <div key={t} className="card-2" style={{ padding: '13px 16px', borderRadius: 14, fontSize: 13, color: 'var(--text)' }}>
              <span style={{ color: 'var(--accent)', marginRight: 8 }}>›</span>{t}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 76, left: 12, right: 12, padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-3)', paddingLeft: 6 }}>Ask anything…</span>
        <div style={{ width: 24, height: 24, color: 'var(--text-3)' }}>{I.mic}</div>
        <div style={{ width: 34, height: 34, borderRadius: 99, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b0b0a' }}>
          <div style={{ width: 15, height: 15 }}>{I.send}</div>
        </div>
      </div>
    </div>
    <TabBar active="coach" />
    <HomeIndicator />
  </>
);

Object.assign(window, { Coach_Main, Coach_Tool, Coach_Empty });
