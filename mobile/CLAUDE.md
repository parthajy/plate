# mobile/CLAUDE.md

Mobile-specific conventions. Read this when working in `/mobile`.
Defers to root `CLAUDE.md` and `DESIGN.md` for anything not covered here.

---

## Stack

- Expo SDK 50+, React Native, TypeScript strict
- Expo Router (file-based)
- NativeWind for styling (Tailwind syntax)
- React Query (TanStack) for server state
- Zustand for client state
- React Hook Form + Zod for forms
- Reanimated 3 for animation
- `expo-secure-store` for tokens, `AsyncStorage` for non-secret prefs
- `@gorhom/bottom-sheet` for modal sheets
- `lucide-react-native` for icons (only icon library — don't add others)

## Folder layout

```
mobile/
  app/                    ← Expo Router screens
    (auth)/
      login.tsx
      signup.tsx
      _layout.tsx         ← stack layout for auth flow
    (onboarding)/
      ...
    (tabs)/
      _layout.tsx         ← bottom tab navigator
      index.tsx           ← Today
      coach.tsx
      scan.tsx
      workouts.tsx
      you.tsx
    _layout.tsx           ← root layout (auth gate, theme)
  components/
    ui/                   ← primitives: Button, Card, Input, Sheet, Pill
    today/                ← Today-screen-specific composites
    coach/
    scan/
    ...
  lib/
    theme.ts              ← color + type + space tokens
    api.ts                ← fetch wrapper with auth + refresh
    auth.ts               ← token storage + refresh logic
    haptics.ts
    formatters.ts         ← kcal, grams, date display
  hooks/
    useDailyTotals.ts
    useFoodLog.ts
    useCoachChat.ts
    ...
  stores/
    auth.ts
    settings.ts
  app.json
  babel.config.js
  tailwind.config.js
```

## Styling rules

- **Tailwind via NativeWind.** Use `className=""` on RN components.
- Theme colors are exposed as Tailwind colors. Use `bg-bg`, `text-text`,
  `border-border`, `bg-accent`, etc. Don't use raw Tailwind colors
  (`bg-zinc-900`) — they bypass theme switching.
- Fonts: configure NativeWind to expose `font-display`, `font-body`, `font-mono`.
- Don't use `StyleSheet.create` unless there's a perf reason (rare). Inline
  `className` is fine.

## Component rules

- Functional components only, with TypeScript prop types.
- Default export the component, named exports for sub-parts.
- No prop drilling more than 2 levels. Lift to a store or use context.
- Server data flows through React Query hooks. Don't fetch in `useEffect`.
- Auth state and theme are global (Zustand). Everything else is local.

## API access pattern

```ts
// lib/api.ts exports a single fetch wrapper that:
// - injects Authorization header
// - auto-refreshes on 401 (once), then retries
// - throws typed errors

// Hooks use it through React Query:
export function useDailyTotals(date: string) {
  return useQuery({
    queryKey: ['totals', date],
    queryFn: () => api.get(`/v1/food/logs?date=${date}`),
    staleTime: 30_000,
  });
}
```

Never call `fetch` directly outside `lib/api.ts`.

## Navigation rules

- Expo Router file-based. The path _is_ the route.
- Group routes with `(group)` folders for layouts that don't show in the URL.
- Use `<Link>` for navigation. Programmatic: `router.push(...)`.
- Tabs persist scroll state — don't unmount them on switch.

## Lists

- Use `FlashList` (`@shopify/flash-list`) for any list > 20 items.
  Significantly better perf than `FlatList` on RN.
- Always set `estimatedItemSize`.

## Forms

- React Hook Form + Zod resolver.
- Validation schemas live in `/shared/schemas` so backend and mobile validate
  the same thing.
- Show errors below the input, in `danger` color, `bodySm` size.

## Performance rules

- Never render large lists without virtualization.
- Memoize expensive components (`React.memo`) when they re-render in lists.
- Animations always run on the UI thread (Reanimated worklets).
- Images: use `expo-image`, set `cachePolicy="memory-disk"`, always set width/height.

## Platform branches

When you need platform-specific code:

```ts
import { Platform } from 'react-native';

const padding = Platform.select({ ios: 16, android: 12 });
```

For larger differences, use `.ios.tsx` / `.android.tsx` file extensions.
Use sparingly — convergence is usually fine.

## Testing

- Component tests with `@testing-library/react-native`. Test behavior, not
  implementation.
- E2E with Maestro (much simpler than Detox). One happy path per major flow.
- Don't write tests for trivial display components.

## Things that have bitten us before

- **Keyboard avoiding views**: use `KeyboardAvoidingView` with `behavior="padding"`
  on iOS, `"height"` on Android. Always.
- **Safe area**: never hardcode top/bottom padding. Use `useSafeAreaInsets()`.
- **Re-renders on every prop**: `useCallback` for handlers passed to memoized
  children. Profile before optimizing.
- **Bundle size**: every dep adds to startup time. Question every install.
- **Status bar color on Android**: must be set via `expo-status-bar`, not
  hardcoded. Otherwise it differs between OEMs.

## When in doubt

1. Match the pattern of an existing similar screen.
2. Keep it boring.
3. Don't introduce a new dependency without justifying it in the PR.
