# FuturePilot v2

A modern Next.js application with Tailwind CSS for beautiful, responsive web development.

## Features

- **Next.js 14+** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe development
- **ESLint** - Code linting and formatting

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd futurepilotv2
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check for code issues

## Project Structure

```
futurepilotv2/
├── src/
│   └── app/
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── .github/
│   └── copilot-instructions.md
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
├── tsconfig.json
└── README.md
```

## Development Guidelines

- Use functional components with React hooks
- Follow Next.js best practices for routing and data fetching
- Use Tailwind CSS utility classes for styling
- Maintain clean, readable code with proper TypeScript types

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.