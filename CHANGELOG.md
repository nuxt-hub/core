# Changelog


## v0.6.0

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.18...v0.6.0)

### 🚀 Enhancements

- **blob:** Support folded option in list() ([#121](https://github.com/nuxt-hub/core/pull/121))
- **blob:** Create `delete-folder` to delete blob folders ([#125](https://github.com/nuxt-hub/core/pull/125))
- `handleUpload()` util and `useUpload()` composable ([#99](https://github.com/nuxt-hub/core/pull/99))
- **blob:** Multipart upload ([#71](https://github.com/nuxt-hub/core/pull/71))

### 🩹 Fixes

- Build ([#123](https://github.com/nuxt-hub/core/pull/123))

### 📖 Documentation

- Add Jonathan Beckman testimonial ([c114f1a](https://github.com/nuxt-hub/core/commit/c114f1a))
- Add tailwindcss ([6323883](https://github.com/nuxt-hub/core/commit/6323883))
- Test nuxt ui resolution ([a5b7468](https://github.com/nuxt-hub/core/commit/a5b7468))
- Update error.vue ([be8e306](https://github.com/nuxt-hub/core/commit/be8e306))
- Add pre-rendering page ([91b0910](https://github.com/nuxt-hub/core/commit/91b0910))

### 🏡 Chore

- Add lint fix script ([#118](https://github.com/nuxt-hub/core/pull/118))
- Update dependencies ([6f6a338](https://github.com/nuxt-hub/core/commit/6f6a338))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Teages ([@Teages](http://github.com/Teages))
- Farnabaz <farnabaz@gmail.com>
- Estéban ([@Barbapapazes](http://github.com/Barbapapazes))

## v0.5.18

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.17...v0.5.18)

### 🚀 Enhancements

- Option to specify storage directory in development ([#112](https://github.com/nuxt-hub/core/pull/112))
- Support dynamic project url ([#117](https://github.com/nuxt-hub/core/pull/117))

### 📖 Documentation

- Update drizzle instructions ([#106](https://github.com/nuxt-hub/core/pull/106))
- Add seed configuration for database population with Nitro Tasks ([#107](https://github.com/nuxt-hub/core/pull/107))

### 🏡 Chore

- Clean zod validation in database api endpoints ([#109](https://github.com/nuxt-hub/core/pull/109))
- Update deps ([d3cdb5c](https://github.com/nuxt-hub/core/commit/d3cdb5c))
- Lint fix ([641a461](https://github.com/nuxt-hub/core/commit/641a461))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Max ([@onmax](http://github.com/onmax))
- Jonathan Beckman ([@unibeck](http://github.com/unibeck))

## v0.5.17

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.16...v0.5.17)

### 🩹 Fixes

- Force nitro preset only in production when remote is disabled ([caed55b](https://github.com/nuxt-hub/core/commit/caed55b))
- **auth:** Use Map instead of plain object ([1ae0f90](https://github.com/nuxt-hub/core/commit/1ae0f90))

### 📖 Documentation

- Remove `\n` for sql queries ([4266acb](https://github.com/nuxt-hub/core/commit/4266acb))
- Force tailwind and ui version ([2429335](https://github.com/nuxt-hub/core/commit/2429335))
- Set pnpm version in engine ([e3dc5a2](https://github.com/nuxt-hub/core/commit/e3dc5a2))

### 🏡 Chore

- Generate wrangler using `confbox` ([927c1b7](https://github.com/nuxt-hub/core/commit/927c1b7))
- Fix wrangler typo in utils ([#96](https://github.com/nuxt-hub/core/pull/96))
- Add issue templates ([48a1065](https://github.com/nuxt-hub/core/commit/48a1065))
- Update deps ([69994d7](https://github.com/nuxt-hub/core/commit/69994d7))
- Remove engines ([3c53e95](https://github.com/nuxt-hub/core/commit/3c53e95))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Dominik Opyd <dominik.opyd@gmail.com>

## v0.5.16

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.15...v0.5.16)

### 🩹 Fixes

- Support also cloudflare-module preset ([89cf607](https://github.com/nuxt-hub/core/commit/89cf607))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.5.15

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.14...v0.5.15)

### 🚀 Enhancements

- Force cloudflare-pages preset ([ccdfb21](https://github.com/nuxt-hub/core/commit/ccdfb21))
- Send build errors back to NuxtHub admin ([#92](https://github.com/nuxt-hub/core/pull/92))

### 🩹 Fixes

- **blob:** Give options for blob dashboard as query ([a245a38](https://github.com/nuxt-hub/core/commit/a245a38))
- Ensure types for server utils are written in prepare step ([#91](https://github.com/nuxt-hub/core/pull/91))

### 📖 Documentation

- Invert cloudflare pages ci and cli ([456a8fb](https://github.com/nuxt-hub/core/commit/456a8fb))

### 🏡 Chore

- Update deps ([2eb119f](https://github.com/nuxt-hub/core/commit/2eb119f))
- Update deps ([ad671c1](https://github.com/nuxt-hub/core/commit/ad671c1))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Farnabaz <farnabaz@gmail.com>
- Daniel Roe ([@danielroe](http://github.com/danielroe))

## v0.5.14

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.13...v0.5.14)

### 🩹 Fixes

- Don't add random suffix by default ([#89](https://github.com/nuxt-hub/core/pull/89))

### 📖 Documentation

- Add server features ([#79](https://github.com/nuxt-hub/core/pull/79))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Farnabaz <farnabaz@gmail.com>

## v0.5.13

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.12...v0.5.13)

### 🚀 Enhancements

- Add local cache for auth with NuxtHub admin ([27174a8](https://github.com/nuxt-hub/core/commit/27174a8))

### 🏡 Chore

- Lint fix ([da07786](https://github.com/nuxt-hub/core/commit/da07786))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.5.12

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.11...v0.5.12)

### 🚀 Enhancements

- Send pagesUrl in build done hook api ([#85](https://github.com/nuxt-hub/core/pull/85))

### 📖 Documentation

- Add link to Wrangler documentation ([#83](https://github.com/nuxt-hub/core/pull/83))

### 🏡 Chore

- Update dependencies ([2f40568](https://github.com/nuxt-hub/core/commit/2f40568))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Arash ([@arashsheyda](http://github.com/arashsheyda))
- Farnabaz ([@farnabaz](http://github.com/farnabaz))

## v0.5.11

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.10...v0.5.11)

### 🩹 Fixes

- **cache:** Avoid destructuring if null ([7565284](https://github.com/nuxt-hub/core/commit/7565284))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.5.10

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.9...v0.5.10)

### 🚀 Enhancements

- New api route to clear all entries of specific base ([#80](https://github.com/nuxt-hub/core/pull/80))

### 📖 Documentation

- Fix broken link in remote section ([#78](https://github.com/nuxt-hub/core/pull/78))

### ❤️ Contributors

- Zac Webb ([@zacwebb](http://github.com/zacwebb))
- Farnabaz ([@farnabaz](http://github.com/farnabaz))

## v0.5.9

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.8...v0.5.9)

### 🩹 Fixes

- Add missing import ([ada8e5b](https://github.com/nuxt-hub/core/commit/ada8e5b))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.5.8

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.7...v0.5.8)

### 🚀 Enhancements

- Add batchDel for cache proxy ([e85719f](https://github.com/nuxt-hub/core/commit/e85719f))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.5.7

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.6...v0.5.7)

### 🩹 Fixes

- Return correct group keys in cache api index ([#75](https://github.com/nuxt-hub/core/pull/75))
- Add cache to manifest ([#77](https://github.com/nuxt-hub/core/pull/77))

### 🏡 Chore

- Move to eslint9 ([#76](https://github.com/nuxt-hub/core/pull/76))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Gerben Mulder <github.undergo381@passmail.net>
- Farnabaz ([@farnabaz](http://github.com/farnabaz))

## v0.5.6

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.5...v0.5.6)

### 🚀 Enhancements

- Cache management ([#73](https://github.com/nuxt-hub/core/pull/73))
- Add server cache tab to devtool ([#74](https://github.com/nuxt-hub/core/pull/74))

### 🩹 Fixes

- Disable remote storage within CF Pages CI ([02f65e5](https://github.com/nuxt-hub/core/commit/02f65e5))

### 📖 Documentation

- Update 2.drizzle.md, typo error : useDb instead of useDrizzle ([#72](https://github.com/nuxt-hub/core/pull/72))
- Escape special chars ([d94892d](https://github.com/nuxt-hub/core/commit/d94892d))

### 🏡 Chore

- Update pnpm-lock.yaml ([a194392](https://github.com/nuxt-hub/core/commit/a194392))
- Update lock ([2a7fab1](https://github.com/nuxt-hub/core/commit/2a7fab1))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Farnabaz ([@farnabaz](http://github.com/farnabaz))
- Samuel LEFEVRE ([@samulefevre](http://github.com/samulefevre))

## v0.5.5

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.4...v0.5.5)

### 🩹 Fixes

- **remote-storage:** Raise error if storage is not enabled in the deployment ([#68](https://github.com/nuxt-hub/core/pull/68))
- Fallback to custom placeholder when openAPI is disabled ([#70](https://github.com/nuxt-hub/core/pull/70))

### 📖 Documentation

- Simplify migrations using drizzle ([f8b3ff7](https://github.com/nuxt-hub/core/commit/f8b3ff7))
- Add Anthony Fu testimonial ([cb47380](https://github.com/nuxt-hub/core/commit/cb47380))

### 🏡 Chore

- Removed unused dependencies ([d7de233](https://github.com/nuxt-hub/core/commit/d7de233))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Farnabaz ([@farnabaz](http://github.com/farnabaz))

## v0.5.4

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.3...v0.5.4)

### 🏡 Chore

- **types:** Remove ts ignore" ([b04a439](https://github.com/nuxt-hub/core/commit/b04a439))
- Remove ts-ignore ([cd5cd49](https://github.com/nuxt-hub/core/commit/cd5cd49))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.5.3

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.2...v0.5.3)

### 🏡 Chore

- **types:** Remove ts ignore ([8c69740](https://github.com/nuxt-hub/core/commit/8c69740))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.5.2

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.1...v0.5.2)

### 🩹 Fixes

- Generate `wrangler.toml` in CF deployment to use bindings ([#63](https://github.com/nuxt-hub/core/pull/63))

### 📖 Documentation

- Add another testimonial ([bcf41ef](https://github.com/nuxt-hub/core/commit/bcf41ef))
- Add section on installation using `nuxi module add` ([#64](https://github.com/nuxt-hub/core/pull/64))
- Added clarifications in self-hosted deployments ([#65](https://github.com/nuxt-hub/core/pull/65))

### ❤️ Contributors

- Max ([@onmax](http://github.com/onmax))
- Farnabaz ([@farnabaz](http://github.com/farnabaz))
- Gangan ([@shinGangan](http://github.com/shinGangan))
- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.5.1

[compare changes](https://github.com/nuxt-hub/core/compare/v0.5.0...v0.5.1)

### 🩹 Fixes

- Cancel build if NuxtHub can't finish build hooks ([#60](https://github.com/nuxt-hub/core/pull/60))
- Define module types in `package.json` ([#59](https://github.com/nuxt-hub/core/pull/59))
- DevTools Database CORS error ([#57](https://github.com/nuxt-hub/core/pull/57))

### 🏡 Chore

- Update deps ([#61](https://github.com/nuxt-hub/core/pull/61))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Harlan Wilton ([@harlan-zw](http://github.com/harlan-zw))
- Farnabaz ([@farnabaz](http://github.com/farnabaz))

## v0.5.0

[compare changes](https://github.com/nuxt-hub/core/compare/v0.4.2...v0.5.0)

### 🚀 Enhancements

- ⚠️  Module option to enable features ([#42](https://github.com/nuxt-hub/core/pull/42))

### 🏡 Chore

- Update error message ([3528421](https://github.com/nuxt-hub/core/commit/3528421))

#### ⚠️ Breaking Changes

- ⚠️  Module option to enable features ([#42](https://github.com/nuxt-hub/core/pull/42))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Farnabaz ([@farnabaz](http://github.com/farnabaz))

## v0.4.2

[compare changes](https://github.com/nuxt-hub/core/compare/v0.4.1...v0.4.2)

### 📖 Documentation

- Fix links in readme ([#45](https://github.com/nuxt-hub/core/pull/45))
- Add testimonial ([84281a2](https://github.com/nuxt-hub/core/commit/84281a2))
- Add Dario testimonial ([f17f7e3](https://github.com/nuxt-hub/core/commit/f17f7e3))

### 🏡 Chore

- Create resources to prepare for new version ([c2debfc](https://github.com/nuxt-hub/core/commit/c2debfc))
- Create hub.config.json ([0342b00](https://github.com/nuxt-hub/core/commit/0342b00))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Sandro Circi ([@Sandros94](http://github.com/Sandros94))

## v0.4.1

[compare changes](https://github.com/nuxt-hub/core/compare/v0.4.0...v0.4.1)

### 🩹 Fixes

- **blob:** Move `HEAD /[path]` to `GET /head/[path]` ([#48](https://github.com/nuxt-hub/core/pull/48))

### 📖 Documentation

- Update screenshot ([3030fc9](https://github.com/nuxt-hub/core/commit/3030fc9))
- Simplify deploy section ([22e9fcc](https://github.com/nuxt-hub/core/commit/22e9fcc))
- New landing ([#44](https://github.com/nuxt-hub/core/pull/44))
- Add Evan You testimonial ([d5c95dd](https://github.com/nuxt-hub/core/commit/d5c95dd))
- Update description for testimonials ([d4ac425](https://github.com/nuxt-hub/core/commit/d4ac425))

### 🏡 Chore

- Fix typos ([d433653](https://github.com/nuxt-hub/core/commit/d433653))

### ❤️ Contributors

- Sylvain Marroufin ([@smarroufin](http://github.com/smarroufin))
- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Florent Delerue <florentdelerue@hotmail.com>

## v0.4.0

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.12...v0.4.0)

### 🚀 Enhancements

- Build hooks in Cloudflare CI ([#40](https://github.com/nuxt-hub/core/pull/40))
- Transform as module ([#37](https://github.com/nuxt-hub/core/pull/37))
- ⚠️  Update deps and force breaking change ([a34d67f](https://github.com/nuxt-hub/core/commit/a34d67f))

### 🏡 Chore

- **release:** V0.3.13 ([dc8f203](https://github.com/nuxt-hub/core/commit/dc8f203))

#### ⚠️ Breaking Changes

- ⚠️  Update deps and force breaking change ([a34d67f](https://github.com/nuxt-hub/core/commit/a34d67f))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Farnabaz ([@farnabaz](http://github.com/farnabaz))

## v0.3.13

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.12...v0.3.13)

### 🚀 Enhancements

- Build hooks in Cloudflare CI ([#40](https://github.com/nuxt-hub/core/pull/40))

### ❤️ Contributors

- Farnabaz ([@farnabaz](http://github.com/farnabaz))

## v0.3.12

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.11...v0.3.12)

### 🚀 Enhancements

- Expose openapi spec under `_hub` secure routes ([#35](https://github.com/nuxt-hub/core/pull/35))

### ❤️ Contributors

- Farnabaz ([@farnabaz](http://github.com/farnabaz))

## v0.3.11

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.10...v0.3.11)

### 🚀 Enhancements

- Add support for Blob & KV in devtools ([#30](https://github.com/nuxt-hub/core/pull/30))

### 📖 Documentation

- Add starter ([4684cde](https://github.com/nuxt-hub/core/commit/4684cde))

### 🏡 Chore

- Update wrangler ([d0018ec](https://github.com/nuxt-hub/core/commit/d0018ec))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.3.10

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.9...v0.3.10)

### 🚀 Enhancements

- Add Hub database in the devtools ([#29](https://github.com/nuxt-hub/core/pull/29))

### 🏡 Chore

- Update renovate.json ([dac1b5f](https://github.com/nuxt-hub/core/commit/dac1b5f))
- Update deps ([edb67fa](https://github.com/nuxt-hub/core/commit/edb67fa))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.3.9

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.8...v0.3.9)

### 🏡 Chore

- Rename console to admin for clarity ([72cfb51](https://github.com/nuxt-hub/core/commit/72cfb51))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.3.8

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.7...v0.3.8)

### 🏡 Chore

- Log when using a different console url ([14e65c6](https://github.com/nuxt-hub/core/commit/14e65c6))
- Improve logs ([ada2a4b](https://github.com/nuxt-hub/core/commit/ada2a4b))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.3.7

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.6...v0.3.7)

### 🩹 Fixes

- Support --remote again ([8e9b13e](https://github.com/nuxt-hub/core/commit/8e9b13e))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.3.6

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.5...v0.3.6)

### 🚀 Enhancements

- Add support for hub.env in runtimeConfig ([d0fefd8](https://github.com/nuxt-hub/core/commit/d0fefd8))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.3.5

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.4...v0.3.5)

### 🩹 Fixes

- Check stringified value ([4394fd3](https://github.com/nuxt-hub/core/commit/4394fd3))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.3.4

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.3...v0.3.4)

### 🚀 Enhancements

- Leverage `nitro-cloudflare-dev` ([#22](https://github.com/nuxt-hub/core/pull/22))
- Support remote storage per env ([#24](https://github.com/nuxt-hub/core/pull/24))

### 📖 Documentation

- Improve remote option ([3ed0c20](https://github.com/nuxt-hub/core/commit/3ed0c20))
- Improve migration with Drizzle ORM ([d057776](https://github.com/nuxt-hub/core/commit/d057776))

### 🏡 Chore

- Update deps ([64ee799](https://github.com/nuxt-hub/core/commit/64ee799))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.3.3

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.2...v0.3.3)

### 📖 Documentation

- Add plausible ([524fd0f](https://github.com/nuxt-hub/core/commit/524fd0f))
- Prepared SQL must contain only one statement ([#19](https://github.com/nuxt-hub/core/pull/19))
- Better handle trailing slash ([0f46859](https://github.com/nuxt-hub/core/commit/0f46859))
- **storage:** Adds JSDocs ([#21](https://github.com/nuxt-hub/core/pull/21))

### 🏡 Chore

- **playground:** Remove remote option ([362c345](https://github.com/nuxt-hub/core/commit/362c345))
- Lint fix ([9ed41d8](https://github.com/nuxt-hub/core/commit/9ed41d8))
- Add renovate ([d31e7dc](https://github.com/nuxt-hub/core/commit/d31e7dc))
- Update deps ([2ed17e0](https://github.com/nuxt-hub/core/commit/2ed17e0))

### ❤️ Contributors

- Sylvain Marroufin ([@smarroufin](http://github.com/smarroufin))
- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Nutchanon Taechasuk ([@Quatton](http://github.com/Quatton))

## v0.3.2

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.1...v0.3.2)

### 🚀 Enhancements

- Support remote storage in production ([#17](https://github.com/nuxt-hub/core/pull/17))

### 📖 Documentation

- Use del instead of delete ([ef21f83](https://github.com/nuxt-hub/core/commit/ef21f83))
- Update readme ([b993d03](https://github.com/nuxt-hub/core/commit/b993d03))
- Correct project link ([#16](https://github.com/nuxt-hub/core/pull/16))

### 🏡 Chore

- Upadte wrangler ([dc34459](https://github.com/nuxt-hub/core/commit/dc34459))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Ray ([@so1ve](http://github.com/so1ve))

## v0.3.1

[compare changes](https://github.com/nuxt-hub/core/compare/v0.3.0...v0.3.1)

### 🚀 Enhancements

- Add `del` as alias of `delete` for `hubBlob()` ([444c382](https://github.com/nuxt-hub/core/commit/444c382))

### 🏡 Chore

- Update deps ([2059138](https://github.com/nuxt-hub/core/commit/2059138))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.3.0

[compare changes](https://github.com/nuxt-hub/core/compare/v0.2.1...v0.3.0)

### 🚀 Enhancements

- ⚠️  Add server cache binding ([e524bfe](https://github.com/nuxt-hub/core/commit/e524bfe))

### 🩹 Fixes

- Correct capitalisation for Cloudflare ([#8](https://github.com/nuxt-hub/core/pull/8))

### 📖 Documentation

- Update 3.deploy.md ([#6](https://github.com/nuxt-hub/core/pull/6))
- Update 3.deploy.md ([#7](https://github.com/nuxt-hub/core/pull/7))
- Update 3.deploy.md ([#10](https://github.com/nuxt-hub/core/pull/10))
- GitHub edit link for content in app.config.ts ([#11](https://github.com/nuxt-hub/core/pull/11))
- Update twitter link ([13a57f3](https://github.com/nuxt-hub/core/commit/13a57f3))
- Fix code snippet in 3.blob.md ([#12](https://github.com/nuxt-hub/core/pull/12))
- Move font to Inter ([fae96d4](https://github.com/nuxt-hub/core/commit/fae96d4))
- Improve content and add cache note ([d4c98d3](https://github.com/nuxt-hub/core/commit/d4c98d3))

### 🏡 Chore

- **blob:** Batch delete ([5c424c8](https://github.com/nuxt-hub/core/commit/5c424c8))
- Lint fix ([a8af37c](https://github.com/nuxt-hub/core/commit/a8af37c))

### 🤖 CI

- Remove `contents: read` permission as repo is now public ([68fc0b4](https://github.com/nuxt-hub/core/commit/68fc0b4))

#### ⚠️ Breaking Changes

- ⚠️  Add server cache binding ([e524bfe](https://github.com/nuxt-hub/core/commit/e524bfe))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Oskar Świtalski 
- Sylvain Marroufin ([@smarroufin](http://github.com/smarroufin))
- Rajeev R Sharma <i.rarsh@gmail.com>
- Rihan ([@RihanArfan](http://github.com/RihanArfan))
- Dale Weaver

## v0.2.1

[compare changes](https://github.com/nuxt-hub/core/compare/v0.2.0...v0.2.1)

### 🩹 Fixes

- Better handle remote storage for utils ([178d95c](https://github.com/nuxt-hub/core/commit/178d95c))

### 📖 Documentation

- Add content components and improve og image ([bfa179e](https://github.com/nuxt-hub/core/commit/bfa179e))
- Update deps ([fde3364](https://github.com/nuxt-hub/core/commit/fde3364))
- Rename to db:generate ([fc485b0](https://github.com/nuxt-hub/core/commit/fc485b0))
- Add prose-a in tip component ([d1f0942](https://github.com/nuxt-hub/core/commit/d1f0942))
- Add template ([156fd22](https://github.com/nuxt-hub/core/commit/156fd22))
- Fixes ([de43c76](https://github.com/nuxt-hub/core/commit/de43c76))
- Fix `wrangler` installation snippets for `npm` & `bun` ([#3](https://github.com/nuxt-hub/core/pull/3))

### 🏡 Chore

- Update social card to jpg ([412911c](https://github.com/nuxt-hub/core/commit/412911c))
- Update ci ([7c857e5](https://github.com/nuxt-hub/core/commit/7c857e5))
- Disable test in CI as they timeout for now ([57386c3](https://github.com/nuxt-hub/core/commit/57386c3))
- **package:** Add homepage ([e9c371d](https://github.com/nuxt-hub/core/commit/e9c371d))
- Correct wording in readme ([#5](https://github.com/nuxt-hub/core/pull/5))
- Rename local data to local storage ([ab7e216](https://github.com/nuxt-hub/core/commit/ab7e216))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Ben 
- Brad Veryard 
- Sylvain Marroufin ([@smarroufin](http://github.com/smarroufin))

## v0.2.0

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.15...v0.2.0)

### 🚀 Enhancements

- ⚠️  Move to layer ([5309e02](https://github.com/nuxt-hub/core/commit/5309e02))

#### ⚠️ Breaking Changes

- ⚠️  Move to layer ([5309e02](https://github.com/nuxt-hub/core/commit/5309e02))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.1.15

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.14...v0.1.15)

### 📖 Documentation

- Improve blob ([66d8c9e](https://github.com/nuxt-hub/core/commit/66d8c9e))

### 🏡 Chore

- **playground:** Add whitelist route ([49df540](https://github.com/nuxt-hub/core/commit/49df540))
- **seo:** Social image ([998decf](https://github.com/nuxt-hub/core/commit/998decf))
- **docs:** Methods params ([394a044](https://github.com/nuxt-hub/core/commit/394a044))
- Rename use to hub prefix to avoid collision with Nitro ([ec7e13f](https://github.com/nuxt-hub/core/commit/ec7e13f))
- Rename proxy and .hub to `.data/hub` ([5d73b42](https://github.com/nuxt-hub/core/commit/5d73b42))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Sylvain Marroufin ([@smarroufin](http://github.com/smarroufin))

## v0.1.14

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.13...v0.1.14)

### 🩹 Fixes

- Handle all and run for database remote proxy ([1f17c08](https://github.com/nuxt-hub/core/commit/1f17c08))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.1.13

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.12...v0.1.13)

### 🩹 Fixes

- Throw only if no projectKey defined ([ef9f0eb](https://github.com/nuxt-hub/core/commit/ef9f0eb))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.1.12

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.11...v0.1.12)

### 📖 Documentation

- Update infos on console ([5dd90bb](https://github.com/nuxt-hub/core/commit/5dd90bb))
- Add baseURL ([1d0172a](https://github.com/nuxt-hub/core/commit/1d0172a))
- Add baseURL" ([ebe27fa](https://github.com/nuxt-hub/core/commit/ebe27fa))
- Fix 404 links ([deeda79](https://github.com/nuxt-hub/core/commit/deeda79))
- Fix lint ([ae2f19f](https://github.com/nuxt-hub/core/commit/ae2f19f))

### 🏡 Chore

- Add screenshot of console ([79b798f](https://github.com/nuxt-hub/core/commit/79b798f))
- Move console to it's own subdomain ([b165577](https://github.com/nuxt-hub/core/commit/b165577))
- Lint ([e80195e](https://github.com/nuxt-hub/core/commit/e80195e))
- Rename to manifest and docs improvements ([ee0e29a](https://github.com/nuxt-hub/core/commit/ee0e29a))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.1.11

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.10...v0.1.11)

### 🩹 Fixes

- Move wrangler out of dependencies ([57ed91a](https://github.com/nuxt-hub/core/commit/57ed91a))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.1.10

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.9...v0.1.10)

### 🩹 Fixes

- If project secret key use, force usage ([f4fbca0](https://github.com/nuxt-hub/core/commit/f4fbca0))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.1.9

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.8...v0.1.9)

### 🩹 Fixes

- Add missing imports ([414ae87](https://github.com/nuxt-hub/core/commit/414ae87))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.1.8

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.7...v0.1.8)

## v0.1.7

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.6...v0.1.7)

### 🩹 Fixes

- Missing createError imports ([551daba](https://github.com/nuxt-hub/core/commit/551daba))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.1.6

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.5...v0.1.6)

### 🩹 Fixes

- Better handle remote primitives ([d66413c](https://github.com/nuxt-hub/core/commit/d66413c))
- Don't auto import server plugin ([6bebc2f](https://github.com/nuxt-hub/core/commit/6bebc2f))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.1.5

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.4...v0.1.5)

### 🩹 Fixes

- Leverage runtime envs for proxy middleware ([6654db7](https://github.com/nuxt-hub/core/commit/6654db7))

### 📖 Documentation

- Fix blob callout ([c457fe9](https://github.com/nuxt-hub/core/commit/c457fe9))
- **drizzle:** Update ([1a52416](https://github.com/nuxt-hub/core/commit/1a52416))
- Add stubs ([0b4b9c3](https://github.com/nuxt-hub/core/commit/0b4b9c3))
- Pages descriptions ([73f6dff](https://github.com/nuxt-hub/core/commit/73f6dff))
- Deploy update + minor updates ([399b3f7](https://github.com/nuxt-hub/core/commit/399b3f7))
- Update ([32d5e0d](https://github.com/nuxt-hub/core/commit/32d5e0d))
- Improve the getting-started ([0e9155d](https://github.com/nuxt-hub/core/commit/0e9155d))
- Update ([c89a6fe](https://github.com/nuxt-hub/core/commit/c89a6fe))
- Small improvements ([01ec0e4](https://github.com/nuxt-hub/core/commit/01ec0e4))

### 🏡 Chore

- **kv:** Update ([07a80c7](https://github.com/nuxt-hub/core/commit/07a80c7))
- Remove password generation as part of nuxt-auth-utils ([9619c6e](https://github.com/nuxt-hub/core/commit/9619c6e))
- Update deps ([4a5b638](https://github.com/nuxt-hub/core/commit/4a5b638))
- **playground:** Various fixes ([9d6f699](https://github.com/nuxt-hub/core/commit/9d6f699))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Sylvain Marroufin ([@smarroufin](http://github.com/smarroufin))

## v0.1.4

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.3...v0.1.4)

### 📖 Documentation

- Update ([cbd48b8](https://github.com/nuxt-hub/core/commit/cbd48b8))
- Update local to remote option ([dbb3e90](https://github.com/nuxt-hub/core/commit/dbb3e90))

### 🏡 Chore

- Remove zod from auto imported utils ([adfc977](https://github.com/nuxt-hub/core/commit/adfc977))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Sylvain Marroufin ([@smarroufin](http://github.com/smarroufin))

## v0.1.3

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.2...v0.1.3)

### 🩹 Fixes

- Add npm registry ([b401606](https://github.com/nuxt-hub/core/commit/b401606))

### 📖 Documentation

- Update blob + miscellanous ([1c98fd7](https://github.com/nuxt-hub/core/commit/1c98fd7))
- Improve description ([24c1ef6](https://github.com/nuxt-hub/core/commit/24c1ef6))

### 🏡 Chore

- Update registry ([e7ffed1](https://github.com/nuxt-hub/core/commit/e7ffed1))
- **logo:** Update ([92b8347](https://github.com/nuxt-hub/core/commit/92b8347))
- **types:** Improve extended zod types ([c03a3ad](https://github.com/nuxt-hub/core/commit/c03a3ad))
- **docs:** Add cf analytics ([1f9f221](https://github.com/nuxt-hub/core/commit/1f9f221))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Sylvain Marroufin ([@smarroufin](http://github.com/smarroufin))

## v0.1.2

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.1...v0.1.2)

### 🩹 Fixes

- Add missing import ([b6c60f2](https://github.com/nuxt-hub/core/commit/b6c60f2))
- Ci ([339be38](https://github.com/nuxt-hub/core/commit/339be38))

### 🏡 Chore

- **docs:** Update build command ([1c23a02](https://github.com/nuxt-hub/core/commit/1c23a02))
- **ci:** Fix permissions ([e97be69](https://github.com/nuxt-hub/core/commit/e97be69))
- Update ci ([7c16820](https://github.com/nuxt-hub/core/commit/7c16820))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.1.1

[compare changes](https://github.com/nuxt-hub/core/compare/v0.1.0...v0.1.1)

### 🩹 Fixes

- Add missing imports ([53485ac](https://github.com/nuxt-hub/core/commit/53485ac))

### 📖 Documentation

- Update package name ([8ca7a04](https://github.com/nuxt-hub/core/commit/8ca7a04))

### 🏡 Chore

- **ci:** Add nightly ([34e955a](https://github.com/nuxt-hub/core/commit/34e955a))
- Update module import ([0dacd0f](https://github.com/nuxt-hub/core/commit/0dacd0f))
- Fix package repo ([8950351](https://github.com/nuxt-hub/core/commit/8950351))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.1.0


### 🚀 Enhancements

- **kv:** Add VK composable & route + notes demo page ([883b4d8](https://github.com/nuxt-hub/core/commit/883b4d8))
- **r2:** Tests ([92e996f](https://github.com/nuxt-hub/core/commit/92e996f))
- Add database tables inspection ([3fa8b99](https://github.com/nuxt-hub/core/commit/3fa8b99))
- Add primary keys and indexes ([3364822](https://github.com/nuxt-hub/core/commit/3364822))
- Support D1 as proxy ([081179d](https://github.com/nuxt-hub/core/commit/081179d))
- Add index columns ([2c14405](https://github.com/nuxt-hub/core/commit/2c14405))
- ⚠️  Remove config, remove drizzle, export proxy utils ([3538004](https://github.com/nuxt-hub/core/commit/3538004))
- Add intAsString on zod ([80f9cd1](https://github.com/nuxt-hub/core/commit/80f9cd1))
- Add ensureBlob ([2b5ce33](https://github.com/nuxt-hub/core/commit/2b5ce33))
- Cli and rename env variables ([5b0a167](https://github.com/nuxt-hub/core/commit/5b0a167))
- Improve cli ([7310e1a](https://github.com/nuxt-hub/core/commit/7310e1a))
- **cli:** Add link command and refactor utils ([9231341](https://github.com/nuxt-hub/core/commit/9231341))
- Support proxy ([9f187ac](https://github.com/nuxt-hub/core/commit/9f187ac))
- Add unlink command ([a734a0f](https://github.com/nuxt-hub/core/commit/a734a0f))
- Remove cli and improve logging ([4dbc18f](https://github.com/nuxt-hub/core/commit/4dbc18f))
- **docs:** Initial documentation ([77116ca](https://github.com/nuxt-hub/core/commit/77116ca))
- Refactor as module ([c0a6b83](https://github.com/nuxt-hub/core/commit/c0a6b83))

### 🩹 Fixes

- **hub:** Ignore mkdir error when `.hub/` already exists ([f934cee](https://github.com/nuxt-hub/core/commit/f934cee))
- Error handling ([a041a94](https://github.com/nuxt-hub/core/commit/a041a94))
- Types ([e0ee310](https://github.com/nuxt-hub/core/commit/e0ee310))
- **storage:** Upload route ([28d97fa](https://github.com/nuxt-hub/core/commit/28d97fa))
- Proxy stream workaround ([d1f7bcd](https://github.com/nuxt-hub/core/commit/d1f7bcd))
- Package.json typo ([d3b6b48](https://github.com/nuxt-hub/core/commit/d3b6b48))
- Return empty array if no tables ([718b624](https://github.com/nuxt-hub/core/commit/718b624))
- Remove config usage and support redirect ([af0d593](https://github.com/nuxt-hub/core/commit/af0d593))
- Support when no CF binding ([00aa6b6](https://github.com/nuxt-hub/core/commit/00aa6b6))
- Add nuxt-auth-utils module ([9025154](https://github.com/nuxt-hub/core/commit/9025154))
- Add missing dep and improve demo ([9bb75ba](https://github.com/nuxt-hub/core/commit/9bb75ba))
- Small update ([14c3d7a](https://github.com/nuxt-hub/core/commit/14c3d7a))
- Final ([7fb9f15](https://github.com/nuxt-hub/core/commit/7fb9f15))
- ⚠️  Remove useHub() composable ([93cc08f](https://github.com/nuxt-hub/core/commit/93cc08f))
- Return if correct ([993639f](https://github.com/nuxt-hub/core/commit/993639f))
- Improve primitives fetching ([8ab4fd1](https://github.com/nuxt-hub/core/commit/8ab4fd1))
- Use projectKey ([16382a4](https://github.com/nuxt-hub/core/commit/16382a4))

### 💅 Refactors

- Rename `bucket` to `blob` ([0a94b4e](https://github.com/nuxt-hub/core/commit/0a94b4e))

### 🏡 Chore

- Wip ([c475cde](https://github.com/nuxt-hub/core/commit/c475cde))
- Update ([8c7c036](https://github.com/nuxt-hub/core/commit/8c7c036))
- Update ([4a6d41c](https://github.com/nuxt-hub/core/commit/4a6d41c))
- Update ([a41546f](https://github.com/nuxt-hub/core/commit/a41546f))
- Rename to nuxthub ([eb0ff3d](https://github.com/nuxt-hub/core/commit/eb0ff3d))
- Up ([8554469](https://github.com/nuxt-hub/core/commit/8554469))
- Update notes form ([2ab7fe8](https://github.com/nuxt-hub/core/commit/2ab7fe8))
- Add dev and prod utils ([51c4140](https://github.com/nuxt-hub/core/commit/51c4140))
- Up ([ef38aa0](https://github.com/nuxt-hub/core/commit/ef38aa0))
- Up ([7728586](https://github.com/nuxt-hub/core/commit/7728586))
- Fix for prod ([8da732a](https://github.com/nuxt-hub/core/commit/8da732a))
- Upload file to storage ([1f85aba](https://github.com/nuxt-hub/core/commit/1f85aba))
- Improve storage form ([49e7936](https://github.com/nuxt-hub/core/commit/49e7936))
- RequireSession first ([82e16ae](https://github.com/nuxt-hub/core/commit/82e16ae))
- **storage:** Put & get file ([01b0bd7](https://github.com/nuxt-hub/core/commit/01b0bd7))
- Add storage deletion ([4fe0349](https://github.com/nuxt-hub/core/commit/4fe0349))
- **storage:** Add delete action & files preview ([d2d1fa0](https://github.com/nuxt-hub/core/commit/d2d1fa0))
- Improve error logging ([1faf68d](https://github.com/nuxt-hub/core/commit/1faf68d))
- **storage:** Allow multiple files upload ([d3bf027](https://github.com/nuxt-hub/core/commit/d3bf027))
- **storage:** Attempt to serve file from route url ([a956284](https://github.com/nuxt-hub/core/commit/a956284))
- **storage:** Move bucket crud logic in `useBlob` ([c97f5a9](https://github.com/nuxt-hub/core/commit/c97f5a9))
- **storage:** Add production hub api routes ([3974989](https://github.com/nuxt-hub/core/commit/3974989))
- **storage:** Improve file customMetadata ([0fdd01b](https://github.com/nuxt-hub/core/commit/0fdd01b))
- **storage:** Update demo page ([890b770](https://github.com/nuxt-hub/core/commit/890b770))
- **storage:** Update production hub api routes ([ba927e6](https://github.com/nuxt-hub/core/commit/ba927e6))
- **storage:** Up (enable nitro asyncContext) ([3c81ba4](https://github.com/nuxt-hub/core/commit/3c81ba4))
- Update README ([7f5833e](https://github.com/nuxt-hub/core/commit/7f5833e))
- Remove kv prefix ([3b4ee43](https://github.com/nuxt-hub/core/commit/3b4ee43))
- **storage:** Improve page display ([7ceee8f](https://github.com/nuxt-hub/core/commit/7ceee8f))
- Improve multipart files parsing ([09a580d](https://github.com/nuxt-hub/core/commit/09a580d))
- Bucket changes ([3594bfb](https://github.com/nuxt-hub/core/commit/3594bfb))
- **storage:** Test-blob ([850f668](https://github.com/nuxt-hub/core/commit/850f668))
- **storage:** Clean and type useBlob ([20d6ea0](https://github.com/nuxt-hub/core/commit/20d6ea0))
- Adds logs command ([cd7d1e3](https://github.com/nuxt-hub/core/commit/cd7d1e3))
- **storage:** Update upload route ([329e932](https://github.com/nuxt-hub/core/commit/329e932))
- **storage:** Serve blob + deps ([7ac3252](https://github.com/nuxt-hub/core/commit/7ac3252))
- **storage:** Up ([5d4b0b1](https://github.com/nuxt-hub/core/commit/5d4b0b1))
- **storage:** Up ([92abb27](https://github.com/nuxt-hub/core/commit/92abb27))
- Try to decode pathname ([1da7e19](https://github.com/nuxt-hub/core/commit/1da7e19))
- Prepare hub server api authorization ([d97b03a](https://github.com/nuxt-hub/core/commit/d97b03a))
- Clean code ([0ae27d8](https://github.com/nuxt-hub/core/commit/0ae27d8))
- Remove `readFormDataFixed` ([3cd35fc](https://github.com/nuxt-hub/core/commit/3cd35fc))
- **blob:** Attempt to put on proxy ([73a01cb](https://github.com/nuxt-hub/core/commit/73a01cb))
- **blob:** Put workaround (no stream) ([44a0561](https://github.com/nuxt-hub/core/commit/44a0561))
- **blob:** Up ([61e402d](https://github.com/nuxt-hub/core/commit/61e402d))
- Use ofetch for proxy requests ([ab70d7a](https://github.com/nuxt-hub/core/commit/ab70d7a))
- Remove zod imports ([c15adce](https://github.com/nuxt-hub/core/commit/c15adce))
- Lint config + indent ([1f5ddf0](https://github.com/nuxt-hub/core/commit/1f5ddf0))
- **config:** Utils ([975a0fb](https://github.com/nuxt-hub/core/commit/975a0fb))
- **auth:** Dynamic provider server route ([b6a9715](https://github.com/nuxt-hub/core/commit/b6a9715))
- Client public config composable ([3cfc682](https://github.com/nuxt-hub/core/commit/3cfc682))
- Up ([dcd1e38](https://github.com/nuxt-hub/core/commit/dcd1e38))
- **kv:** Use binding in local ([e6fa288](https://github.com/nuxt-hub/core/commit/e6fa288))
- Lint ([5223aef](https://github.com/nuxt-hub/core/commit/5223aef))
- Improve loggings ([77e6800](https://github.com/nuxt-hub/core/commit/77e6800))
- Split kv & config ([61f32f2](https://github.com/nuxt-hub/core/commit/61f32f2))
- Up ([acfbd4e](https://github.com/nuxt-hub/core/commit/acfbd4e))
- Move to layer structure ([0f1bb0c](https://github.com/nuxt-hub/core/commit/0f1bb0c))
- Fix tsconfig ([c163243](https://github.com/nuxt-hub/core/commit/c163243))
- Leverage useHub().auth ([e5817b1](https://github.com/nuxt-hub/core/commit/e5817b1))
- Lint ([17e9d5e](https://github.com/nuxt-hub/core/commit/17e9d5e))
- **release:** Release v0.0.1 ([ffdcc0a](https://github.com/nuxt-hub/core/commit/ffdcc0a))
- Public package ([b69fe4b](https://github.com/nuxt-hub/core/commit/b69fe4b))
- Update package name ([cb30ffd](https://github.com/nuxt-hub/core/commit/cb30ffd))
- **auth:** Provider success hook ([8cbe7cb](https://github.com/nuxt-hub/core/commit/8cbe7cb))
- **release:** Release v0.0.2 ([62d8c5a](https://github.com/nuxt-hub/core/commit/62d8c5a))
- Handle fresh env variable ([f0c52ec](https://github.com/nuxt-hub/core/commit/f0c52ec))
- **release:** Release v0.0.3 ([f581166](https://github.com/nuxt-hub/core/commit/f581166))
- Fix demo ([2c4b7fb](https://github.com/nuxt-hub/core/commit/2c4b7fb))
- **release:** Release v0.0.4 ([34251cf](https://github.com/nuxt-hub/core/commit/34251cf))
- **release:** Release v0.0.5 ([a814c49](https://github.com/nuxt-hub/core/commit/a814c49))
- **release:** Release v0.1.0 ([ab3215b](https://github.com/nuxt-hub/core/commit/ab3215b))
- **release:** Release v0.1.1 ([3dfb576](https://github.com/nuxt-hub/core/commit/3dfb576))
- Add typecheck command ([0f40fdb](https://github.com/nuxt-hub/core/commit/0f40fdb))
- Fix & typecheck ([1965479](https://github.com/nuxt-hub/core/commit/1965479))
- **release:** Release v0.1.2 ([8a75419](https://github.com/nuxt-hub/core/commit/8a75419))
- **release:** Release v0.1.3 ([c17f871](https://github.com/nuxt-hub/core/commit/c17f871))
- **analytics:** Add beacon plugin (experimental) ([6f0a271](https://github.com/nuxt-hub/core/commit/6f0a271))
- **analytics:** Update ([92381d8](https://github.com/nuxt-hub/core/commit/92381d8))
- **analytics:** Remove beacon plugin ([6357fa9](https://github.com/nuxt-hub/core/commit/6357fa9))
- **analytics:** Add to wrangler ([c2850a0](https://github.com/nuxt-hub/core/commit/c2850a0))
- **analytics:** Server composable (WIP) ([5d0f321](https://github.com/nuxt-hub/core/commit/5d0f321))
- Update deps ([381a81a](https://github.com/nuxt-hub/core/commit/381a81a))
- **release:** Release v0.1.4 ([322bf7e](https://github.com/nuxt-hub/core/commit/322bf7e))
- **release:** Release v0.1.5 ([e05886f](https://github.com/nuxt-hub/core/commit/e05886f))
- **release:** Release v0.1.6 ([0d9a875](https://github.com/nuxt-hub/core/commit/0d9a875))
- **release:** Release v0.1.7 ([4fececd](https://github.com/nuxt-hub/core/commit/4fececd))
- **release:** Release v0.1.8 ([4bd5fdf](https://github.com/nuxt-hub/core/commit/4bd5fdf))
- **release:** Release v0.1.9 ([f2ca1ee](https://github.com/nuxt-hub/core/commit/f2ca1ee))
- Update deps ([c02bd87](https://github.com/nuxt-hub/core/commit/c02bd87))
- **release:** Release v0.2.0 ([53add24](https://github.com/nuxt-hub/core/commit/53add24))
- **release:** Release v0.2.1 ([2cbef5e](https://github.com/nuxt-hub/core/commit/2cbef5e))
- **release:** Release v0.2.2 ([5726a95](https://github.com/nuxt-hub/core/commit/5726a95))
- Ignore on prepare ([08d42e1](https://github.com/nuxt-hub/core/commit/08d42e1))
- Update module ([62cf3f2](https://github.com/nuxt-hub/core/commit/62cf3f2))
- **release:** Release v0.2.3 ([fd0ce56](https://github.com/nuxt-hub/core/commit/fd0ce56))
- Add projectId ([8885057](https://github.com/nuxt-hub/core/commit/8885057))
- **release:** Release v0.2.4 ([859eecc](https://github.com/nuxt-hub/core/commit/859eecc))
- Update lock ([9fedc8b](https://github.com/nuxt-hub/core/commit/9fedc8b))
- Add primitives check ([e212046](https://github.com/nuxt-hub/core/commit/e212046))
- Improve logging ([abf16e8](https://github.com/nuxt-hub/core/commit/abf16e8))
- **release:** Release v0.2.5 ([1f8943a](https://github.com/nuxt-hub/core/commit/1f8943a))
- **release:** Release v0.2.6 ([b235d84](https://github.com/nuxt-hub/core/commit/b235d84))
- **ci:** Update ci ([93ce83c](https://github.com/nuxt-hub/core/commit/93ce83c))
- Update permissions for ci ([a4e6a67](https://github.com/nuxt-hub/core/commit/a4e6a67))
- Update playground design ([047f0ba](https://github.com/nuxt-hub/core/commit/047f0ba))
- **test:** Add missing import ([a33371f](https://github.com/nuxt-hub/core/commit/a33371f))
- **playground:** Add basic auth ([fbb042b](https://github.com/nuxt-hub/core/commit/fbb042b))
- **docs:** Update ([d10328a](https://github.com/nuxt-hub/core/commit/d10328a))
- Update types command ([b19d4a5](https://github.com/nuxt-hub/core/commit/b19d4a5))
- Update types ([b3d0739](https://github.com/nuxt-hub/core/commit/b3d0739))
- Update deps ([e8095ad](https://github.com/nuxt-hub/core/commit/e8095ad))
- Update ([60dba2b](https://github.com/nuxt-hub/core/commit/60dba2b))

#### ⚠️ Breaking Changes

- ⚠️  Remove config, remove drizzle, export proxy utils ([3538004](https://github.com/nuxt-hub/core/commit/3538004))
- ⚠️  Remove useHub() composable ([93cc08f](https://github.com/nuxt-hub/core/commit/93cc08f))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Sylvain Marroufin ([@smarroufin](http://github.com/smarroufin))

