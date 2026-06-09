# Minimal SaaS Starter

A production-ready, minimal SaaS starter kit built on the latest bleeding-edge web stack: **Next.js 16**, **React 19**, and **TypeScript**. Designed for developers who want to bypass setup friction and jump straight into building core features with a beautifully pre-configured architecture.

## 🚀 Features

* 🔐 **Next-Gen Authentication** — Powered by [better-auth](https://better-auth.com) for modular, secure, and developer-friendly session management.
* 💾 **Robust Database Layer** — Fully integrated [Prisma](https://prisma.io) ORM bound to a localized SQLite backend for instant, zero-infra prototyping.
* 🎨 **Enterprise-Grade UI/UX** — Clean, scalable layout architecture combining [shadcn/ui](https://ui.shadcn.com) and the lightning-fast utilities of [Tailwind CSS 4](https://tailwindcss.com).
* 🌙 **Native Dark Mode** — Smooth, flicker-free theme switching out of the box using [next-themes](https://github.com/pacocoursey/next-themes).
* 📝 **Type-Safe Validation** — Runtime schema validation via [Zod](https://zod.dev) ensuring end-to-end data integrity.
* 🔔 **Sleek Notifications** — Non-blocking, beautiful toast notifications handled cleanly by [Sonner](https://sonner.emilkowal.ski).
* ⚡ **Optimized Iconography** — High-performance SVG icons sourced directly from [Lucide React](https://lucide.dev).

---

## 🛠️ Tech Stack

| Technology | Layer | Version |
| --- | --- | --- |
| **Next.js** | Core Framework | `16.2.x` |
| **React** | UI Runtime | `19.2.x` |
| **TypeScript** | Programming Language | `5.x` |
| **Prisma** | Database ORM | Latest |
| **SQLite** | Database Backend | Built-in |
| **Better-Auth** | Authentication Engine | `1.6.x` |
| **Tailwind CSS** | Styling Framework | `4.x` |

---

## 📁 Project Structure

```text
├── app/                  # Next.js App Router (Pages, layouts, and server actions)
├── components/           # UI Components split into shared atomic blocks (shadcn/ui)
│   └── ui/               # Core, unstyled base UI atomic primitives
├── hooks/                # Custom reusable client-side React hooks
├── lib/                  # Core singletons, utility functions, and configurations (Prisma/Auth)
├── prisma/               # Active relational schema definitions and migration tracking
├── public/               # Optimized static assets and global vectors
├── .env                  # Local runtime environment variables (git-ignored)
└── .env.example          # Public blueprint for required environment variables

```

---

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed locally:

* **Node.js** `18.x` or higher
* **pnpm** package manager (recommended for optimized caching)

### 1. Installation

Clone the repository, navigate to the directory, and install dependencies:

```bash
pnpm install

```

### 2. Environment Configuration

Duplicate the template environment file to create your local runtime registry:

```bash
cp .env.example .env

```

Open `.env` and configure your localized tokens, session keys, and database paths.

### 3. Database Initialization

Generate your type-safe Prisma client and push the localized SQLite schema to your generated database file:

```bash
pnpm prisma migrate dev --name init

```

### 4. Running the Development Server

Boot up the local Next.js compilation engine:

```bash
pnpm dev

```

Open your browser and navigate to [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to view your running application.

---

## ⚙️ Core Management Commands

### Database Pipelines

When mutating or upgrading fields inside `prisma/schema.prisma`, use the following toolchains to keep your code in sync:

* **Trigger Schema Migration:**
```bash
pnpm prisma migrate dev

```


* **Launch Graphical Database GUI (Prisma Studio):**
```bash
pnpm prisma studio

```



### Production Compilation

To bundle, static-optimize, and inspect the production bundle footprint:

```bash
pnpm build
pnpm start

```

---

## 📚 Technical Documentation & Resources

Deepen your understanding of the underlying architectures utilized by this boilerplate:

* 📑 [Next.js App Router Architecture](https://nextjs.org/docs)
* 💾 [Prisma Data Modeling Guides](https://www.prisma.io/docs/)
* 🔐 [Better-Auth Modular Plugins & Client API](https://better-auth.com)
* 🎨 [Tailwind CSS v4 Utility Specifications](https://tailwindcss.com)

---

## 📄 License

This starter kit is open-source software licensed under the [MIT License](https://www.google.com/search?q=LICENSE). Feel free to customize, fork, and scale commercial applications globally without restrictions.