# Onboarding images

Used by the split-screen onboarding splash (`src/components/ui/OnboardingSplash.tsx`).

- `backgroud_right_side.png` — full-bleed hero image on the RIGHT half.
- `card1.png` … `card5.png` — the image on each feature card (LEFT half carousel),
  in order:

| File | Card |
| --- | --- |
| `card1.png` | Karta CHINOR 100 |
| `card2.png` | Shahar sodiqligi |
| `card3.png` | CHINOR BUS |
| `card4.png` | Shahar reytingi |
| `card5.png` | Fizik · Raqamli · Media shahar |

If a file is missing, that card falls back to a branded gradient + icon. To
reorder or rename, edit the `IMG('…')` / `BG_RIGHT` calls in `OnboardingSplash.tsx`.
