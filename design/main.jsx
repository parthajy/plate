/* === Plate gallery — assemble all sections === */
/* global React, ReactDOM, Section, Phone */
/* global Onb_Welcome, Onb_Sex, Onb_HW, Onb_Activities, Onb_Goal, Onb_Rate, Onb_Targets */
/* global Today_Typical, Today_Empty, Today_Over, Today_Past */
/* global Log_Search, Log_Portion, Log_Barcode */
/* global Scan_View, Scan_Result, Scan_LowConf */
/* global Coach_Main, Coach_Tool, Coach_Empty */
/* global Pantry_List, Recipe_Generated, Recipe_Cooking */
/* global Workouts_Main, Workouts_TypeSelect, Workouts_GymDetail, You_Main, You_Weight */

const App = () => (
  <div className="page">
    <header className="page-top">
      <div className="brand">
        <span className="dot" />
        <span>Plate</span>
      </div>
      <div className="brand-tag">In-app UI · Design review · Nov 2025</div>
    </header>

    <Section
      num="1"
      title="First-time <em>experience</em>"
      desc="The onboarding flow is the entire first impression. Fast, intentional, no celebratory copy."
    >
      <Phone rot="1" cnum="1.1" title="Welcome / sign-in" note="The headline is the product."><Onb_Welcome /></Phone>
      <Phone rot="2" cnum="1.2" title="Sex & birthdate" note="Native wheel — familiar, dismissible."><Onb_Sex /></Phone>
      <Phone rot="3" cnum="1.3" title="Height & weight" note="Numbers in display — these are the hero data."><Onb_HW /></Phone>
      <Phone rot="4" cnum="1.4" title="Activities (multi-select)" note="Lime + glow signals a confident pick."><Onb_Activities /></Phone>
      <Phone rot="5" cnum="1.5" title="Goal" note="Recomp pre-selected — that's where most regulars land."><Onb_Goal /></Phone>
      <Phone rot="6" cnum="1.6" title="Rate slider" note="Helper copy disarms the 'faster = better' impulse."><Onb_Rate /></Phone>
      <Phone rot="1" cnum="1.7" title="Your targets, calculated" note="Show the math, don't hide it."><Onb_Targets /></Phone>
    </Section>

    <Section
      num="2"
      title="The home — <em>Today</em>"
      desc="The same screen at 7am, 2pm and 9pm reads differently. Tone follows the time."
    >
      <Phone rot="2" cnum="2.1" title="Today — typical mid-day" note="Most users open the app here, between meals."><Today_Typical /></Phone>
      <Phone rot="3" cnum="2.2" title="Today — early morning" note="Empty state with permission to start fresh."><Today_Empty /></Phone>
      <Phone rot="4" cnum="2.3" title="Today — over budget" note="Reassuring, not punishing. Week-level framing."><Today_Over /></Phone>
      <Phone rot="5" cnum="2.4" title="Day scrubber — past day" note="Looking back without dwelling."><Today_Past /></Phone>
    </Section>

    <Section
      num="3"
      title="Logging food — <em>manual</em> path"
      desc="The most-used flow. It has to be fast, but never feel rushed."
    >
      <Phone rot="6" cnum="3.1" title="Add food — search" note="Recent first. Mid-typing state."><Log_Search /></Phone>
      <Phone rot="2" cnum="3.2" title="Adjust portion" note="Big number, big steppers, quick picks."><Log_Portion /></Phone>
      <Phone rot="3" cnum="3.3" title="Barcode scan" note="Result slides up so context stays visible."><Log_Barcode /></Phone>
    </Section>

    <Section
      num="4"
      title="AI food <em>scan</em>"
      desc="Point. Done. Three confidence states — the app commits when it's sure, hedges when it isn't."
    >
      <Phone rot="1" cnum="4.1" title="Scan — viewfinder" note="Detection happens live in-frame."><Scan_View /></Phone>
      <Phone rot="4" cnum="4.2" title="Scan — high confidence" note="Big numbers, single primary CTA."><Scan_Result /></Phone>
      <Phone rot="5" cnum="4.3" title="Scan — low confidence" note="Amber, not red. Coach the user back."><Scan_LowConf /></Phone>
    </Section>

    <Section
      num="5"
      title="Coach <em>Kai</em>"
      desc="An AI coach with context. Not a chatbot — a presence that already knows yesterday."
    >
      <Phone rot="2" cnum="5.1" title="Coach — main thread" note="Suggestion chips replace open-ended prompts."><Coach_Main /></Phone>
      <Phone rot="6" cnum="5.2" title="Coach — tool use" note="Show the work — analyzing, computing, answering."><Coach_Tool /></Phone>
      <Phone rot="3" cnum="5.3" title="Coach — first run" note="Three opening moves, no greeting wall."><Coach_Empty /></Phone>
    </Section>

    <Section
      num="6"
      title="Pantry → <em>recipe</em>"
      desc="What's in the fridge becomes dinner. Filters first, generation second, cooking mode third."
    >
      <Phone rot="4" cnum="6.1" title="Pantry — ingredients" note="Emoji as content, never as chrome."><Pantry_List /></Phone>
      <Phone rot="5" cnum="6.2" title="Recipe generated" note="AI label small. The recipe earns its space."><Recipe_Generated /></Phone>
      <Phone rot="1" cnum="6.3" title="Cooking mode" note="One instruction at a time. Timer is the only chrome."><Recipe_Cooking /></Phone>
    </Section>

    <Section
      num="7"
      title="<em>Workouts</em>"
      desc="Logging a session should be as fast as logging a meal. Same vocabulary, different verbs."
    >
      <Phone rot="3" cnum="7.1" title="Workouts — main" note="Calendar first, history second, FAB to add."><Workouts_Main /></Phone>
      <Phone rot="2" cnum="7.2" title="Type select" note="Six tiles. No 'other' until you really need it."><Workouts_TypeSelect /></Phone>
      <Phone rot="6" cnum="7.3" title="Gym detail" note="Exercise rows read like a workout journal."><Workouts_GymDetail /></Phone>
    </Section>

    <Section
      num="8"
      title="<em>You</em>"
      desc="Profile, trend, settings. The streak is acknowledged once. Not gamified."
    >
      <Phone rot="5" cnum="8.1" title="You — main" note="Stats up top, hairline list below. No badges."><You_Main /></Phone>
      <Phone rot="4" cnum="8.2" title="Weight trend" note="Lime line, no fill. Tap a point for a moment."><You_Weight /></Phone>
    </Section>

    <footer className="footer">
      <span>Plate — designed Nov 2025</span>
      <span>{`24 screens · 8 sections · 1 system`}</span>
    </footer>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
