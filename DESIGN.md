# DESIGN.md — PLATE

The single source of truth for everything visual and interactive. Claude Code reads
this before touching any UI file. If you find yourself improvising a color, font,
or spacing value not listed here, stop — either it belongs in the system or it
shouldn't exist.

---

## Design philosophy

**Sleek. Editorial. Confident.** Not "wellness." Not "purple gradient SaaS."
Not "neon Strava." Think: dark luxury watch face meets a well-designed magazine
spread. Most consumer fitness apps look like they were made for influencers —
ours looks like it was made for someone who works.

Three principles, in order of priority:

1. **Speed.** The fastest path to logging food is the product. Every screen
   should feel like it loaded before you got there. No spinners over 200ms
   without a skeleton. No multi-step flows where one-step works.
2. **Restraint.** Most pixels do nothing. The few that do, do a lot. Generous
   negative space. Type does the heavy lifting, not chrome.
3. **Personality, in moments.** The italic display headers, the lime accent,
   the coach's voice — these are the moments where the app shows it has taste.
   Everywhere else, get out of the way.

---

## Color tokens

All colors live in `mobile/lib/theme.ts` as a single exported object. Never
hardcode hex anywhere else.

### Dark theme (default)

```ts
export const colors = {
  // Backgrounds
  bg:         '#0b0b0a',  // page background — warm near-black
  bgWarm:     '#100f0d',  // slightly elevated (modal sheets)
  surface:    '#161513',  // cards, list items
  surface2:   '#1d1c19',  // input fields, raised surfaces
  border:     '#28261f',  // hairlines
  borderHi:   '#3a3830',  // emphasized borders, focused inputs

  // Text
  text:       '#f6f3e9',  // primary — warm cream, NOT pure white
  text2:      '#b8b4a5',  // secondary
  text3:      '#6f6c61',  // tertiary / metadata
  textInv:    '#000000',  // on accent backgrounds

  // Brand
  accent:     '#dcff4f',  // electric lime — primary CTA, key data
  accentDim:  '#a8c43c',  // accent on hover/pressed
  accent2:    '#ff6a1a',  // burnt orange — secondary accent, sparingly

  // Semantic
  good:       '#7ee08a',  // success, "on track"
  warn:       '#ffb347',  // caution, over budget by a little
  danger:     '#ff5a5a',  // error, well over budget

  // Macro chart colors (consistent everywhere)
  protein:    '#dcff4f',  // lime
  carbs:      '#ff6a1a',  // orange
  fat:        '#ffb347',  // amber
}
```

### Light theme (must work, ship together with dark)

Light isn't an afterthought — many users will set their system to light. Don't
just invert. Light mode has its own warmth.

```ts
export const colorsLight = {
  bg:         '#faf8f1',  // off-white, warm
  bgWarm:     '#f3efe3',
  surface:    '#ffffff',
  surface2:   '#f3efe3',
  border:     '#e6e0cf',
  borderHi:   '#cfc8b3',

  text:       '#15140f',
  text2:      '#5a574d',
  text3:      '#8a857a',
  textInv:    '#ffffff',

  accent:     '#7a9b00',  // darker lime (lime on white is unreadable)
  accentDim:  '#5d7700',
  accent2:    '#c75518',

  good:       '#3d8a4a',
  warn:       '#c47700',
  danger:     '#c93838',

  protein:    '#7a9b00',
  carbs:      '#c75518',
  fat:        '#c47700',
}
```

**Default is dark.** Respect `useColorScheme()`. Persist user override in SecureStore.

---

## Typography

We mix **system fonts for body** (best performance, native feel) with **one
custom display font** (Fraunces) for personality in headers.

### Fonts

- **Body / UI**: System default — San Francisco on iOS, Roboto on Android.
  Use Expo's default font stack, no loading required.
- **Display (headers, hero numbers)**: **Fraunces** — variable font, loaded via
  `expo-font`. Use the italic axis for emphasis ("Eat _smart_").
- **Mono (data, timestamps, labels)**: System mono — SF Mono / Roboto Mono.

### Scale

```ts
export const type = {
  // Display — Fraunces, opsz 144, weight 400-500
  display1:   { font: 'Fraunces', size: 44, lineHeight: 46, letterSpacing: -1.2, weight: '400' },
  display2:   { font: 'Fraunces', size: 32, lineHeight: 34, letterSpacing: -0.8, weight: '400' },
  display3:   { font: 'Fraunces', size: 24, lineHeight: 26, letterSpacing: -0.5, weight: '500' },

  // Body — System
  bodyLg:     { size: 17, lineHeight: 24, weight: '400' },
  body:       { size: 15, lineHeight: 22, weight: '400' },
  bodySm:     { size: 13, lineHeight: 18, weight: '400' },

  // Labels — System, slightly heavier
  label:      { size: 13, lineHeight: 16, weight: '500' },
  labelSm:    { size: 11, lineHeight: 14, weight: '500' },

  // Mono — for numbers, codes, timestamps
  mono:       { font: 'mono', size: 12, lineHeight: 16, letterSpacing: 0.5, weight: '500' },
  monoSm:     { font: 'mono', size: 10, lineHeight: 13, letterSpacing: 1.2, weight: '500' }, // UPPERCASE labels
}
```

### Rules

- **Hero numbers** (calories remaining, weight, PRs) → display1 or display2,
  Fraunces. These are the moments of personality.
- **Italics are reserved for the display font** — never italicize body text.
- **UPPERCASE labels** use mono, with letter-spacing. e.g. "TODAY · 9:41 AM".
- **No more than 2 fonts on a screen.** Display + body. Mono counts as a third
  only for data labels.
- **No `fontWeight: 'bold'` in body text.** If something needs emphasis, use a
  display header or change the color.

---

## Spacing

4pt grid. Never improvise.

```ts
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
  9: 96,
}
```

- Tap targets: minimum 44pt (iOS) / 48dp (Android). Use `hitSlop` to extend if
  the visual size is smaller.
- Safe area: respect `useSafeAreaInsets()`. Never hardcode notch/home-indicator heights.
- Screen padding: 20pt horizontal default.

---

## Corners and elevation

```ts
export const radius = {
  sm: 8,    // chips, small buttons
  md: 12,   // input fields, list items
  lg: 16,   // cards
  xl: 22,   // modal sheets
  full: 9999,
}
```

**No shadows on Android** — they look bad, render badly, hurt perf.
Use a 1px border in `borderHi` instead, or a slightly elevated background.
iOS shadows are fine but keep them subtle:

```ts
// iOS only
shadowColor: '#000',
shadowOpacity: 0.15,
shadowRadius: 12,
shadowOffset: { width: 0, height: 4 },
```

---

## Motion

**React Native Reanimated 3.** Spring-based, not duration-based, where possible.

```ts
// Standard spring
withSpring(value, { damping: 18, stiffness: 200, mass: 1 })

// Snappy (buttons, toggles)
withSpring(value, { damping: 22, stiffness: 380 })

// Soft (sheet opens, screen transitions)
withSpring(value, { damping: 20, stiffness: 140 })
```

### Rules

- Screen transitions: ≤ 250ms.
- Tap feedback: 50–80ms scale to 0.97 on press, spring back.
- Loading states: skeleton, never a spinner over 200ms.
- Number changes (calorie ring, macro bars): animate with `withTiming` over
  600ms easing out. Numbers tick from previous value to new.
- Don't animate everything. The screen-load stagger is a one-shot delight;
  micro-interactions are noise if there are too many.

---

## Iconography

**Use `lucide-react-native`.** One library, consistent style, tree-shakeable.
Never mix icon libraries.

- Default stroke width: 2
- Default size: 24
- Tab bar icons: 22, with text label below
- In-line icons in text: 16, vertically centered with line-height

Never use emoji as a UI element (food log meal icons are an exception — they're
content, not chrome).

---

## Components — patterns we lean on

### Cards

Default card:
- Background: `surface`
- Border: 1px `border`
- Radius: `lg` (16)
- Padding: `space.4` (16)

Don't stack borders. If a card contains another bordered element, the inner
element drops its border.

### Buttons

Three variants. That's all.

1. **Primary** — accent background, black text, used once per screen
2. **Secondary** — surface2 background, text color, used for "Cancel" etc
3. **Ghost** — transparent, text2 color, used for tertiary actions

Sizes: `sm` (32h), `md` (44h, default), `lg` (52h, hero CTAs only).

### Input fields

- Background: `surface2`
- Border: 1px `border`, becomes `accent` on focus
- Radius: `md` (12)
- Height: 48
- Placeholder: `text3`

### Bottom tab bar

- 5 tabs max. Currently planned: **Today · Coach · [Scan] · Workouts · You**
- Center "Scan" is a circular elevated button in `accent`, slightly above the bar
- Tab icons + tiny mono labels (8–9pt)
- Height: 64 + safe-area-bottom

### Modal sheets

Use `@gorhom/bottom-sheet`. Native feel, gesture-driven.
- Drag-to-dismiss
- Backdrop: black at 50% opacity
- Sheet bg: `bgWarm`
- Top corner radius: `xl` (22)

---

## Screen patterns

### The Today screen

This is the most-viewed screen. Treat it accordingly.

- Hero: greeting in display3, today's date in mono uppercase below
- Calorie ring (circular SVG progress), 116pt diameter, centered upper portion
- Macro bars (Protein, Carbs, Fat) below in a 3-column grid
- Meal log list below
- Pull-to-refresh enabled
- The big calorie number remaining uses display1. Make it the hero.

### Coach screen

- Chat-like, full-bleed messages with rounded bubbles
- AI bubbles: `surface` bg, `text` text, left-aligned, rounded except bottom-left
- User bubbles: `accent` bg, black text, right-aligned, rounded except bottom-right
- Suggestion chips below the latest AI bubble — tap to send
- Composer pinned above tab bar, 22pt radius rounded input + circular send button in accent

### Scan screen

- Full-bleed camera view
- Top: brief instruction in display3 ("Point. _Done._")
- Live detection rectangle with corner brackets in `accent`
- "Analyzing · X%" pill top-right (live model confidence)
- Bottom sheet (75% closed by default) shows detected food, portion estimate,
  macros, and a Log button — slides up smoothly when detection is confident

### Pantry / Recipes

- Top: heading "Got _these_. Make me something." in display2
- Ingredient chips, tap to remove
- Filter chips (cook time, high-protein, vegetarian, low-carb)
- Generated recipe card: title in display3, meta row in mono (24min · 38g·P · 520kcal),
  numbered steps, primary CTA "Start cooking"

---

## Accessibility

Non-negotiable, not optional.

- **Contrast**: all text must hit WCAG AA. Test light mode too — `text3` on
  `bg` is the riskiest pair.
- **Tap targets**: min 44×44 iOS / 48×48 dp Android. Use `hitSlop`.
- **Screen reader labels**: every icon button needs `accessibilityLabel`.
  Every chart needs a text alternative ("Calorie ring, 1247 of 2400, 52% complete").
- **Dynamic Type / font scaling**: don't lock font sizes. Use `allowFontScaling`
  defaults. Test at 200% size.
- **Color is never the only signal.** "Over your protein goal" should also
  say "over goal" in text or an icon, not just turn red.
- **Reduce Motion**: respect `useReducedMotion()` — replace springs with
  instant transitions when set.

---

## Platform-specific touches

A few places we *don't* enforce cross-platform consistency, because native
feel matters more:

- **Haptics**: `expo-haptics` on iOS only by default. Android haptics feel
  cheap; opt-in via setting.
- **Date picker**: use the native date picker on each platform.
- **Tab bar**: slightly taller on Android (gesture nav bar is shorter).
- **Status bar**: light content on dark theme, dark content on light theme.
  Use `expo-status-bar`.
- **Pull-to-refresh**: native on both platforms via `RefreshControl`.

---

## What we never do

Things that will get rejected in code review on aesthetic grounds:

- Purple-to-blue gradients
- Glassmorphism / heavy blur backgrounds
- Card shadows on Android
- Emoji used decoratively (a 🔥 icon on a streak counter is lazy)
- Rounded buttons larger than radius.lg
- More than 2 colors per screen besides the brand palette
- Animations that "wow" but slow things down
- Login screens with a stock photo background
- "Welcome back, [Name]! 🎉"
- A loading spinner where a skeleton would do
- Generic stock icons that don't match Lucide's stroke style
- Light grey on white. We use warm tones. Pure greyscale is a tell of laziness.

---

## When extending

If you genuinely need a new color, font weight, or spacing value:

1. Justify it (what's wrong with the existing options?)
2. Add it to the theme file as a named token
3. Use it consistently — not once

Don't sprinkle hex codes through component files. If it's worth using twice,
it's worth a name.
