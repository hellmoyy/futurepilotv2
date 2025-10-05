# Public Assets

This folder contains static assets that are publicly accessible.

## Structure

```
public/
├── images/
│   ├── logos/          # Brand logos (futurepilot logo, exchange logos, etc.)
│   ├── icons/          # App icons, favicons, etc.
│   └── backgrounds/    # Background images, patterns, etc.
├── favicon.ico         # Browser favicon
└── README.md          # This file
```

## Usage

Files in the `public` folder can be referenced from the root URL.

### Example:
```tsx
// In your components
<Image src="/images/logos/futurepilot-logo.png" alt="FuturePilot" />

// Or with Next.js Image component
import Image from 'next/image';
<Image src="/images/logos/logo.png" width={200} height={50} alt="Logo" />
```

## Guidelines

1. **Image Optimization**: Use WebP or optimized PNG/JPG formats
2. **Naming Convention**: Use kebab-case (e.g., `logo-dark.png`, `exchange-binance.svg`)
3. **Size**: Keep images optimized for web (compress before uploading)
4. **SVG Preferred**: For logos and icons, use SVG when possible for scalability
5. **Organization**: Keep files organized in appropriate subdirectories

## Recommended Assets to Add

- [ ] FuturePilot logo (light/dark versions)
- [ ] Favicon (16x16, 32x32, 192x192, 512x512)
- [ ] Exchange logos (Binance, Bybit, KuCoin)
- [ ] Social media share image (Open Graph)
- [ ] App icons for PWA
