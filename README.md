# NuxtHub

The Nuxt Toolkit to create full-stack applications on the Edge.

## Features

- Session management with secured & sealed cookie sessions
- Create and query typed collections with `useDatabase()`
- Access key-value storage with `useKV()`
- Store files with `useBlob()`
- Edge configuration available with `getConfig()` and `useConfig()` (vue app)

## Blob

### Upload a blob

```ts
const blob = await useBlob().put('my-file.txt', 'Hello World!', {
  contentType: 'text/plain' // optional, will be inferred from the file extension
  addRandomSuffix: true // optional, will add a suffix to the filename to avoid collisions
})
/*
{
  pathname: 'my-file-12345.txt',
  contentType: 'text/plain',
  size: 12,
  uploadedAt: '2021-08-12T15:00:00.000Z'
}
*/
```

### Usage with file upload

```ts
export default eventHandler(async (event) => {
  const form = await readFormData(event)
  const file = form.get('file')

  return useBlob().put(file.name, file)
})
```

### List blobs

```ts
// Get a blob object
const { blobs, cursor, hasMore } = await useBlob().list({
  limit: 10, // optional, default to 1000
  prefix: 'my-dir', // optional, will only list blobs starting with `my-dir`
})
```

#### Pagination

```ts
const blob = useBlob()
let blobs = []
let hasMore = true
let cursor

while (hasMore) {
  const result = await blob.list({
    cursor,
  })
  blobs.push(...result.blobs)
  hasMore = result.hasMore
  cursor = result.cursor
}
```

### Get blob metadata

```ts
const blob = await useBlob().head('my-file.txt')
```

### Delete a blob

```ts
await useBlob().delete('my-file.txt')
```

It returns a void response. A delete action is always successful if the blob url exists. A delete action won't throw if the blob url doesn't exists.

### Serve a blob

```ts
// server/routes/[...pathname].get.ts
export default eventHandler(event => {
  const pathname = event.context.params.pathname
  return useBlob().serve(event, pathname)
})
```

## Key-Value Storage

- useKV() -> process.env.KV binding
- useConfig() -> process.env.KV with `_config` key

- useKV().setItem('public/')

### Get a value

```ts
const value = await useKV().get('my-key')
```

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
