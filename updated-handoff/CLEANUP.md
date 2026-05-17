# Cleanup checklist for `packages/`

The handoff replaces several pieces of the current codebase. Before merging the new tokens, the engineer should:

## Delete

These files in `packages/shared/src/theme/tokens/` are dead:

```sh
rm packages/shared/src/theme/tokens/glassmorphism.json
rm packages/shared/src/theme/tokens/liquidglass.json
rm packages/shared/src/theme/tokens/neobrutalism.json
rm packages/shared/src/theme/tokens/neomorphism.json
```

These were Tamagui starter junk. Two themes only: Sovereign + Solarpunk.

## Replace

| Current | Replacement |
|---------|-------------|
| `packages/shared/src/theme/tokens/base.json` | Delete. Replaced by `handoff/01-tokens/tokens.ts` (source) + generated `tokens.dtcg.json`. |
| `packages/shared/src/theme/tokens/darkmode.json` | Same. |
| `packages/shared/src/theme/dtcg.utils.ts` | Delete. Replaced by `scripts/generate-tokens.mjs` (a 30-line generator from `tokens.ts`). |
| `packages/shared/src/theme/tamagui.config.ts` | Delete. |
| `packages/shared/src/theme/tamagui.tokens.ts` | Delete. |
| `packages/shared/src/theme/tamagui.themes.ts` | Delete. |
| `packages/shared/src/theme/tamagui.fonts.ts` | Delete. |
| `packages/shared/src/theme/TamaguiThemeProvider.tsx` | Replace with `ThemeProvider.tsx` (~30 lines, vanilla React Context). |
| `packages/shared/src/theme/useCurrentTheme.ts` | Replace with `useTheme.ts` (~10 lines). |
| `packages/shared/src/theme/index.ts` | Re-export the new module surface. |

## Remove from `package.json`

Drop every Tamagui dep from both `packages/web/package.json` and `packages/mobile/package.json`:

```diff
- "@tamagui/animations-css": "^1.142.0",
- "@tamagui/core": "^1.140.3",
- "@tamagui/dialog": "^1.142.0",
- "@tamagui/helpers-icon": "^1.142.0",
- "@tamagui/lucide-icons": "^1.142.0",
- "@tamagui/polyfill-dev": "^1.142.0",
- "@tamagui/popover": "^1.140.3",
- "@tamagui/portal": "^1.142.0",
- "@tamagui/switch": "^1.142.0",
- "@tamagui/tabs": "^1.142.0",
- "@tamagui/toast": "^1.142.0",
- "@tamagui/tooltip": "^1.142.0",
- "burnt": "^0.13.0",
```

Replacements:

| Tamagui component | Plain RN equivalent |
|-------------------|---------------------|
| `<Stack>`, `<XStack>`, `<YStack>` | `<View>` |
| `<Text>` (Tamagui) | `<Text>` (RN) |
| `<Button>` | `<Pressable>` |
| `<Dialog>` | a custom `<Modal>` wrapper around RN `Modal` (web uses portal) |
| `<Popover>` | a custom positioned `<View>` (use `react-native-svg`'s positioning math) |
| `<Switch>` | RN `<Switch>` (native) |
| `<Toast>` (burnt) | a custom toast queue (50 lines) — or keep burnt if you like it; it's tamagui-independent |
| `<Tooltip>` | a custom hover-only component (only renders on web via `Pressable`'s `hovered`) |
| `<Tabs>` | a custom segmented control (see `gallery-tier1.jsx` CommandPanel mode selector for the pattern) |

Most are 20–40 lines each and ship as part of `packages/shared/src/components/`.

## Keep

- `react-native-web` and the Vite plugin — these are the cross-platform bridge.
- `react-native-svg` — used for charts and SLD.
- `react-native-screens` and `react-native-safe-area-context` — RN navigation needs them.
- `react-native-gifted-charts` — charting backend; the `TimeseriesChart` component wraps it.
- `ip-address`, `zod`, `yaml`, `ts-pattern` — domain libs, no UI.

## Verify

Once the swap is done, run:

```sh
# 1. No Tamagui imports remain
rg "@tamagui" packages/      # should return zero hits

# 2. No raw hex in component files
rg '#[0-9a-fA-F]{3,8}' packages/*/src/components/    # should return zero hits

# 3. Tokens generate cleanly
cd packages/shared && npm run tokens:generate
git diff --stat src/theme/tokens.dtcg.json src/theme/tokens.css

# 4. Tests still pass
npm test

# 5. Playwright handoff specs pass
npx playwright test handoff/04-playwright/
```

The `audit-packages` step in your `package.json checks` should now have many fewer dependencies to scan — bonus security surface reduction.
