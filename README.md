# Minimal SaaS Starter

A modern, minimal SaaS starter built with **Next.js 16**, **React 19**, and **TypeScript**. Includes authentication, database, and UI components out of the box.

## Features

- 🔐 **Authentication** — [better-auth](https://better-auth.com) for secure user authentication
- 💾 **Database** — [Prisma](https://prisma.io) ORM with SQLite backend
- 🎨 **UI Components** — [shadcn/ui](https://ui.shadcn.com) with [Tailwind CSS](https://tailwindcss.com)
- 🌙 **Dark Mode** — Built-in theme switching with [next-themes](https://github.com/pacocoursey/next-themes)
- 📝 **Form Validation** — [Zod](https://zod.dev) for schema validation
- 🔔 **Notifications** — [Sonner](https://sonner.emilkowal.ski) toast notifications
- ⚡ **Icons** — [Lucide React](https://lucide.dev) icon library

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

### Build & Deploy

```bash
pnpm build
pnpm start
```

## Project Structure

```
├── app/              # Next.js app directory
├── components/       # Reusable React components
├── lib/             # Utility functions
├── hooks/           # Custom React hooks
├── prisma/          # Database schema and migrations
├── public/          # Static assets
└── .env             # Environment variables (create from .env.example)
```

## Configuration

### Database

Prisma is configured to use SQLite by default. Edit prisma/schema.prisma to modify the schema.

```bash
pnpm prisma migrate dev
pnpm prisma studio
```

### Environment Variables

Create a .env file in the root directory (see .env.example if available).

## Tech Stack

- **Framework** — Next.js 16.2.6
- **Runtime** — React 19.2.4
- **Language** — TypeScript 5
- **Database** — Prisma + SQLite
- **Auth** — better-auth 1.6.11
- **Styling** — Tailwind CSS 4 + shadcn/ui
- **Validation** — Zod

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [better-auth Docs](https://better-auth.com)
- [shadcn/ui Components](https://ui.shadcn.com)

## License

MIT
