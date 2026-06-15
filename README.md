This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Documentation

- [Authentication and authorization](./AUTHENTICATION.md)

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Database environments

The application uses one `DATABASE_URL` per environment:

- Local development: keep the local MySQL URL in `.env`.
- Vercel production: set `DATABASE_URL` in the Vercel project's Environment Variables.
- Vercel preview: use the production database only when preview deployments are allowed to modify production data; otherwise use a separate preview database.

Hostinger production URL format:

```text
mysql://HOSTINGER_USER:URL_ENCODED_PASSWORD@HOSTINGER_MYSQL_HOST:3306/HOSTINGER_DATABASE
```

Passwords must be URL encoded. In particular, encode `$` as `%24`. Do not commit the production URL or password.

Before deploying:

1. In Hostinger hPanel, enable remote MySQL access and use the MySQL hostname shown by hPanel. A website/server IP is not necessarily the MySQL hostname.
2. Make sure Vercel can be allowed through Hostinger's IP rules. Normal Vercel deployments do not have one stable outbound IP; Vercel Static IPs or another database/proxy that supports Vercel is required when Hostinger requires a fixed allowlisted IP.
3. Set `DATABASE_URL` under Vercel Project Settings > Environment Variables for Production.
4. From a trusted machine that Hostinger permits, apply the Prisma schema:

```bash
npm run db:push
```

5. Redeploy the Vercel project.

Do not implement automatic failover from production to a developer laptop's local database. `localhost` on Vercel refers to the Vercel runtime, and switching writes between unsynchronized databases can corrupt application state.
