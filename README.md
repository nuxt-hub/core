# Nuxt Todo List on the Edge

A demonstration using [Nuxt](https://nuxt.com) with server-side rendering on the edge, authentication and database querying using SQLite in production.

## Features

- [Server-Side Rendering on the Edge](https://nuxt.com/blog/nuxt-on-the-edge)
- Authentication backed-in using [nuxt-auth-utils](https://github.com/Atinux/nuxt-auth-utils)
- Leverage SQLite as database with migrations using [drizzle ORM](https://orm.drizzle.team/)
- User interface made with [Nuxt UI](https://ui.nuxt.com)
- Embed [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview/) in the [Nuxt DevTools](https://devtools.nuxt.com)

## Live demos

- CloudFlare Pages + D1: https://nuxt-todos-edge.pages.dev
- CloudFlare Pages + Turso: https://nuxt-todos-turso.pages.dev
- Lagon.app + Turso: https://nuxt-todos.lagon.dev
- Vercel Edge + Turso: https://nuxt-todos-edge.vercel.app
- Netlify Edge + Turso: https://nuxt-todos-edge.netlify.app
- Deno Deploy + Turso: https://nuxt-todos-edge.deno.dev

https://github.com/Atinux/nuxt-todos-edge/assets/904724/5f3bee55-dbae-4329-8057-7d0e16e92f81

## Setup

Make sure to install the dependencies using [pnpm](https://pnpm.io/):

```bash
pnpm i
```

Create a [GitHub Oauth Application](https://github.com/settings/applications/new) with:
- Homepage url: `http://localhost:3000`
- Callback url: `http://localhost:3000/api/auth/github`

Add the variables in the `.env` file:

```bash
NUXT_OAUTH_GITHUB_CLIENT_ID="my-github-oauth-app-id"
NUXT_OAUTH_GITHUB_CLIENT_SECRET="my-github-oauth-app-secret"
```

To create sealed sessions, you also need to add `NUXT_SESSION_SECRET` in the `.env` with at least 32 characters:

```bash
NUXT_SESSION_SECRET=your-super-long-secret-for-session-encryption
```

## Development

Start the development server on http://localhost:3000

```bash
npm run dev
```

In the Nuxt DevTools, you can see your tables by clicking on the Drizzle Studio tab:

https://github.com/Atinux/nuxt-todos-edge/assets/904724/7ece3f10-aa6f-43d8-a941-7ca549bc208b

## Deploy on CloudFlare Pages

Create a CF pages deployment linked to your GitHub repository. Make sure to select Version 2 (Beta) as the build system version.

### Environment variables

```bash
NUXT_OAUTH_GITHUB_CLIENT_ID=...
NUXT_OAUTH_GITHUB_CLIENT_SECRET=...
NUXT_SESSION_PASSWORD=...
```

### Build command

Set the build command to:

```bash
npm run build
```

And the output directory to `dist/`

### D1 Database

Lastly, in the project settings -> Functions, add the binding between your D1 database and the `DB` variable:

![d1-binding](https://user-images.githubusercontent.com/904724/236021974-d77dfda6-4eb7-4094-ae36-479be73ec35f.png)

Copy the contents from `server/database/migrations/0000_heavy_xorn.sql` into the D1 console to seed the database.

### Turso Database

You can also use [Turso](https://turso.tech/) database instead of CloudFlare D1 by creating a database and adding the following env variables:

```
TURSO_DB_URL=...
TURSO_DB_TOKEN=...
```

You can see a live demo using Turso on https://nuxt-todos-turso.pages.dev

## License

[MIT License](./LICENSE)
