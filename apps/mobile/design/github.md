repo: itzsrikanth/akshar
branch: main

## Last sync
date: 2026-08-07T16:09:58Z

### Updated in this project
- Built Home, Explore, and Reader mobile screens (iOS + Android) using Colors.light/Typography/Radius/Spacing tokens from src/constants/theme.ts and the product-brief.md/iconography.md decisions.
- Reader content uses real ch01-bannada-tagadina data (source, Devanagari transliteration, English translation) from api/KSEEB/Karnataka/English/Grade5/Kannada/ch01-bannada-tagadina.json.
- Explore chapter list reflects real coverage from api/contents.json (ch01 has EN+Devanagari, ch02 has neither).

## Screen map
| Screen | Source files |
|---|---|
| Home | apps/mobile/src/components/app-header.tsx, src/constants/theme.ts, docs/product-brief.md |
| Explore | apps/mobile/docs/product-brief.md, api/contents.json |
| Reader | apps/mobile/docs/product-brief.md, api/KSEEB/.../ch01-bannada-tagadina.json, src/constants/theme.ts (Typography.reading) |
