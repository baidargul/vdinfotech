This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Authentication setup

The login, signup, and dashboard routes require MongoDB and a session secret. Copy
`.env.example` to `.env.local`, then update these values:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/vdinfotech
SESSION_SECRET=replace-with-a-random-secret-containing-at-least-32-characters
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production, use your hosted MongoDB connection string and generate a unique,
high-entropy session secret. Never commit `.env.local`.

Blog images and downloadable files are stored in `storage/blog` by default. Set
`BLOG_UPLOAD_DIR` to an absolute path on a persistent writable disk in production.
Local file storage is not suitable for ephemeral or serverless deployments without
a mounted volume. Downloads accept PDF, DOCX, XLSX, PPTX, TXT, CSV, and ZIP files
up to 20 MB.

Shared hero templates are stored as JSON files in `storage/hero-templates` by
default. Set `HERO_TEMPLATE_DIR` to an absolute path on the same kind of persistent
writable volume in production. Template writes use lock files and atomic renames;
all application instances must share this directory.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
