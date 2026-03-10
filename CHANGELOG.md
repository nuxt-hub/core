# Changelog


## v0.10.7

[compare changes](https://github.com/nuxt-hub/core/compare/v0.10.5...v0.10.7)

### 🚀 Enhancements

- **db:** Add support for database replica ([#808](https://github.com/nuxt-hub/core/pull/808))
- **cli:** Add "name" and "custom" arguments for db generate cli command ([#816](https://github.com/nuxt-hub/core/pull/816))
- **cli:** Add `--force` flag to skip confirmation when dropping all tables ([#834](https://github.com/nuxt-hub/core/pull/834))
- **db:** Add `hub.db.applyMigrationsDuringDev: boolean` option ([#837](https://github.com/nuxt-hub/core/pull/837))
- **db:** Use drizzle studio d1 driver ([#846](https://github.com/nuxt-hub/core/pull/846))

### 🩹 Fixes

- **db:** Generate schema types during prepare ([#795](https://github.com/nuxt-hub/core/pull/795))
- Change Cloudflare D1 API URI ([#794](https://github.com/nuxt-hub/core/pull/794))
- **devtools:** Point Drizzle Studio to correct D1 database file ([#806](https://github.com/nuxt-hub/core/pull/806))
- **db:** Create package.json during prepare ([#797](https://github.com/nuxt-hub/core/pull/797))
- **db:** Resolve Nuxt aliases in schema bundling ([#802](https://github.com/nuxt-hub/core/pull/802))
- **db:** Correct D1 migrations_dir path in wrangler.json ([#814](https://github.com/nuxt-hub/core/pull/814))
- **playground:** Fix get todos database query ([#819](https://github.com/nuxt-hub/core/pull/819))
- Fix incorrect license in README ([#829](https://github.com/nuxt-hub/core/pull/829))
- **db:** Resolve @nuxthub/db from rootDir for pnpm workspaces ([#828](https://github.com/nuxt-hub/core/pull/828))
- **db:** Bundle cache schema entries ([#833](https://github.com/nuxt-hub/core/pull/833))
- **db:** Respect explicit libsql driver on Cloudflare ([#842](https://github.com/nuxt-hub/core/pull/842))
- **db:** Pass driver options to postgres-js ([#844](https://github.com/nuxt-hub/core/pull/844))

### 📖 Documentation

- Fix typo in schema documentation ([#807](https://github.com/nuxt-hub/core/pull/807))
- Add environments, CI/CD guide, and env vars reference ([#804](https://github.com/nuxt-hub/core/pull/804))
- Add nuxt-studio ([64f9105](https://github.com/nuxt-hub/core/commit/64f9105))
- Make formatting in db migrate command usage consistant ([#822](https://github.com/nuxt-hub/core/pull/822))
- Update migration handling for Cloudflare D1 ([#848](https://github.com/nuxt-hub/core/pull/848))
- **blob:** Clarify nuxt image dev config ([#851](https://github.com/nuxt-hub/core/pull/851))
- Fix typo in url ([d4e24b3](https://github.com/nuxt-hub/core/commit/d4e24b3))

### 🏡 Chore

- Update deps ([7a8ec94](https://github.com/nuxt-hub/core/commit/7a8ec94))
- Update deps" ([a5f46e9](https://github.com/nuxt-hub/core/commit/a5f46e9))
- **release:** V0.10.6 ([ea6305c](https://github.com/nuxt-hub/core/commit/ea6305c))
- Don't pass empty params to kit cli ([43dc045](https://github.com/nuxt-hub/core/commit/43dc045))

### ❤️ Contributors

- Rihan Arfan ([@RihanArfan](https://github.com/RihanArfan))
- Max <maximogarciamtnez@gmail.com>
- M Reinhard ([@michaelreinhard1](https://github.com/michaelreinhard1))
- Branislav Juhás ([@branislavjuhaas](https://github.com/branislavjuhaas))
- Miguelrk <miguelromerokaram@gmail.com>
- Hareland ([@hareland](https://github.com/hareland))
- Darius Haskell ([@hsklnet](https://github.com/hsklnet))
- Sébastien Chopin ([@atinux](https://github.com/atinux))
- Jens Becker <mail@jens.pub>
- Nogic ([@nogic1008](https://github.com/nogic1008))

## v0.10.6

[compare changes](https://github.com/nuxt-hub/core/compare/v0.10.5...v0.10.6)

### 🚀 Enhancements

- **db:** Add support for database replica ([#808](https://github.com/nuxt-hub/core/pull/808))

### 🩹 Fixes

- **db:** Generate schema types during prepare ([#795](https://github.com/nuxt-hub/core/pull/795))
- Change Cloudflare D1 API URI ([#794](https://github.com/nuxt-hub/core/pull/794))
- **devtools:** Point Drizzle Studio to correct D1 database file ([#806](https://github.com/nuxt-hub/core/pull/806))
- **db:** Create package.json during prepare ([#797](https://github.com/nuxt-hub/core/pull/797))
- **db:** Resolve Nuxt aliases in schema bundling ([#802](https://github.com/nuxt-hub/core/pull/802))

### 📖 Documentation

- Fix typo in schema documentation ([#807](https://github.com/nuxt-hub/core/pull/807))

### 🏡 Chore

- Update deps ([7a8ec94](https://github.com/nuxt-hub/core/commit/7a8ec94))
- Update deps" ([a5f46e9](https://github.com/nuxt-hub/core/commit/a5f46e9))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](https://github.com/atinux))
- Max <maximogarciamtnez@gmail.com>
- Jens Becker <mail@jens.pub>
- Nogic ([@nogic1008](https://github.com/nogic1008))

## v0.10.5

[compare changes](https://github.com/nuxt-hub/core/compare/v0.10.4...v0.10.5)

### 🚀 Enhancements

- Add support for `workflow` and other external bundlers ([#779](https://github.com/nuxt-hub/core/pull/779))

### 🩹 Fixes

- **cli:** Handle D1 driver in CLI commands ([#759](https://github.com/nuxt-hub/core/pull/759))
- **blob:** Validate multipart upload body ([#763](https://github.com/nuxt-hub/core/pull/763))
- **db:** Generate schema types during nuxt prepare ([#758](https://github.com/nuxt-hub/core/pull/758))
- **kv,cache:** Merge default binding when driver explicitly set ([#767](https://github.com/nuxt-hub/core/pull/767))
- Support https dev server with drizzle studio when using pglite ([#753](https://github.com/nuxt-hub/core/pull/753))
- Enable Node.js compatibility for Cloudflare Workers ([#780](https://github.com/nuxt-hub/core/pull/780))
- **db:** Skip tsconfig resolution during schema build ([#785](https://github.com/nuxt-hub/core/pull/785))
- **devtools:** Pass local-network-access permission to drizzle studio embed ([4f11aae](https://github.com/nuxt-hub/core/commit/4f11aae))
- **db:** Lazy URL resolution for Docker/K8s deployments ([#790](https://github.com/nuxt-hub/core/pull/790))
- **db:** Use libsql in dev mode when cloudflare preset is set ([#775](https://github.com/nuxt-hub/core/pull/775))
- **db:** Use dynamic import for migrations plugin ([#788](https://github.com/nuxt-hub/core/pull/788))

### 📖 Documentation

- Clarify migration guide for v0.10.3+ ([#770](https://github.com/nuxt-hub/core/pull/770))
- **blob:** Add image provider dev limitations ([#782](https://github.com/nuxt-hub/core/pull/782))

### ❤️ Contributors

- Max <maximogarciamtnez@gmail.com>
- Sébastien Chopin <seb@nuxt.com>
- Rihan Arfan ([@RihanArfan](https://github.com/RihanArfan))

## v0.10.4

[compare changes](https://github.com/nuxt-hub/core/compare/v0.10.3...v0.10.4)

### 🚀 Enhancements

- **db:** Nuxt db squash ([#739](https://github.com/nuxt-hub/core/pull/739))
- **db:** Nuxt db drop-all ([#736](https://github.com/nuxt-hub/core/pull/736))

### 🩹 Fixes

- **types:** Properly export ModuleHooks ([d2060fd](https://github.com/nuxt-hub/core/commit/d2060fd))
- **db:** Add ts declaration for `hub:db:schema` ([#733](https://github.com/nuxt-hub/core/pull/733))
- **db:** Update `neon-http` connection string format in setup.ts ([#750](https://github.com/nuxt-hub/core/pull/750))

### 📖 Documentation

- Restructure docs, update routes & navigation ([#717](https://github.com/nuxt-hub/core/pull/717))
- Add og image ([7edb2fc](https://github.com/nuxt-hub/core/commit/7edb2fc))
- Clarify D1 migrations not run during build ([#734](https://github.com/nuxt-hub/core/pull/734))
- Auto-generate wrangler bindings from config ([#732](https://github.com/nuxt-hub/core/pull/732))
- Clean up prose tabs spacing ([#738](https://github.com/nuxt-hub/core/pull/738))
- **blob:** Add @nuxt/image integration guide ([#729](https://github.com/nuxt-hub/core/pull/729))
- **installation:** Update module installation command ([#749](https://github.com/nuxt-hub/core/pull/749))

### 🏡 Chore

- Update deps ([e49c264](https://github.com/nuxt-hub/core/commit/e49c264))

### ❤️ Contributors

- Adam Kasper ([@adamkasper](https://github.com/adamkasper))
- Rihan Arfan ([@RihanArfan](https://github.com/RihanArfan))
- Sébastien Chopin ([@atinux](https://github.com/atinux))
- Max <maximogarciamtnez@gmail.com>
- Mrkaashee <mrkaashee@gmail.com>
- Hugo <hugo.richard@vercel.com>

## v0.10.3

[compare changes](https://github.com/nuxt-hub/core/compare/v0.10.2...v0.10.3)

### 🚀 Enhancements

- **db:** Support drizzle casing ([#731](https://github.com/nuxt-hub/core/pull/731))
- Auto-generate wrangler bindings from hub config ([#716](https://github.com/nuxt-hub/core/pull/716))

### 🩹 Fixes

- **db:** Pass mode to drizzle for mysql ([#730](https://github.com/nuxt-hub/core/pull/730))
- **build:** Merge nitro generated env to root in wrangler.json ([#720](https://github.com/nuxt-hub/core/pull/720))

### ❤️ Contributors

- Max <maximogarciamtnez@gmail.com>
- Rihan Arfan ([@RihanArfan](https://github.com/RihanArfan))

## v0.10.2

[compare changes](https://github.com/nuxt-hub/core/compare/v0.10.1...v0.10.2)

### 🚀 Enhancements

- **blob:** Add support for access and improve s3 driver ([#709](https://github.com/nuxt-hub/core/pull/709))
- **db:** Add `drizzle-orm/neon-http` support ([#713](https://github.com/nuxt-hub/core/pull/713))

### 🩹 Fixes

- **db:** Resolve JSON $type<> types in schema ([#723](https://github.com/nuxt-hub/core/pull/723))
- Make sure to run tsdown in new context for proper types generation ([038ea73](https://github.com/nuxt-hub/core/commit/038ea73))

### 📖 Documentation

- Add `PageHeaderLinks` and MCP server ([#705](https://github.com/nuxt-hub/core/pull/705))
- Remove unused badge ([2a37e09](https://github.com/nuxt-hub/core/commit/2a37e09))

### 🏡 Chore

- Fix neon http test ([50fda23](https://github.com/nuxt-hub/core/commit/50fda23))
- Update deps ([34fafdd](https://github.com/nuxt-hub/core/commit/34fafdd))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](https://github.com/atinux))
- Max <maximogarciamtnez@gmail.com>
- Adam Kasper ([@adamkasper](https://github.com/adamkasper))
- Hugo <hugo.richard@vercel.com>

## v0.10.1

[compare changes](https://github.com/nuxt-hub/core/compare/v0.10.0...v0.10.1)

### 🩹 Fixes

- **db:** Lazy D1/Hyperdrive binding access ([#694](https://github.com/nuxt-hub/core/pull/694))
- **db:** Setup config relative path on windows ([#702](https://github.com/nuxt-hub/core/pull/702))
- Support d1 local migrations ([fa0b2b7](https://github.com/nuxt-hub/core/commit/fa0b2b7))
- Add no_bundle mode ([b2cb2fc](https://github.com/nuxt-hub/core/commit/b2cb2fc))

### 📖 Documentation

- Today is the 10th ([50a838c](https://github.com/nuxt-hub/core/commit/50a838c))
- Fix logo in banner ([c782f00](https://github.com/nuxt-hub/core/commit/c782f00))
- Fix typos ([e8047cf](https://github.com/nuxt-hub/core/commit/e8047cf))
- Version selector typo ([#695](https://github.com/nuxt-hub/core/pull/695))
- Add Claude Code migration skill link ([#696](https://github.com/nuxt-hub/core/pull/696))

### 🏡 Chore

- Update css ([d60fa8f](https://github.com/nuxt-hub/core/commit/d60fa8f))
- Disable cloudflare-module locally ([c6e3459](https://github.com/nuxt-hub/core/commit/c6e3459))
- Simplify cache driver for cloudflare ([5a13325](https://github.com/nuxt-hub/core/commit/5a13325))
- Revert compat date ([38d7ed8](https://github.com/nuxt-hub/core/commit/38d7ed8))
- Try using nitro default with latest compat date ([4ae483a](https://github.com/nuxt-hub/core/commit/4ae483a))
- Try to set compat flag manually ([b00d094](https://github.com/nuxt-hub/core/commit/b00d094))
- Try bundling again ([96517c5](https://github.com/nuxt-hub/core/commit/96517c5))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](https://github.com/atinux))
- Muhamad Rizki ([@byrizki](https://github.com/byrizki))
- Max <maximogarciamtnez@gmail.com>

## v0.10.0

[compare changes](https://github.com/nuxt-hub/core/compare/v0.9.1...v0.10.0)

### 🚀 Enhancements

- ⚠️  Make nuxthub multi-vendor ([#693](https://github.com/nuxt-hub/core/pull/693))

### 📖 Documentation

- Update changelog date to today ([31ced48](https://github.com/nuxt-hub/core/commit/31ced48))

#### ⚠️ Breaking Changes

- ⚠️  Make nuxthub multi-vendor ([#693](https://github.com/nuxt-hub/core/pull/693))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](https://github.com/atinux))

## v0.9.1

[compare changes](https://github.com/nuxt-hub/core/compare/v0.9.0...v0.9.1)

### 🚀 Enhancements

- Use prose-img from `@nuxt/ui-pro` ([#573](https://github.com/nuxt-hub/core/pull/573))
- **types:** Export `HubBlob` interface for external use ([#658](https://github.com/nuxt-hub/core/pull/658))
- Self hosting first ([#686](https://github.com/nuxt-hub/core/pull/686))

### 🩹 Fixes

- Prefer `nitro.static` over `_generate` ([#601](https://github.com/nuxt-hub/core/pull/601))
- **types:** Add missing type definition for databaseMigrationsDirs ([#635](https://github.com/nuxt-hub/core/pull/635))
- **migrations:** Do not return after first successful migrate ([#659](https://github.com/nuxt-hub/core/pull/659))

### 📖 Documentation

- Update changelog date ([9e9d6fe](https://github.com/nuxt-hub/core/commit/9e9d6fe))
- Add image in changelog ([94aee1c](https://github.com/nuxt-hub/core/commit/94aee1c))
- **cache:** Add note on cache key normalization and escapeKey usage ([#632](https://github.com/nuxt-hub/core/pull/632))

### 🏡 Chore

- Update banner ([b3709d9](https://github.com/nuxt-hub/core/commit/b3709d9))

### ❤️ Contributors

- Rihan Arfan ([@RihanArfan](https://github.com/RihanArfan))
- Daniel ([@Dantescur](https://github.com/Dantescur))
- Farnabaz <farnabaz@gmail.com>
- Muntasir Mahmud ([@MuntasirSZN](https://github.com/MuntasirSZN))
- Mr Kaashee <mrkaashee@gmail.com>
- Hugo Richard <hugo.richard@epitech.eu>
- Daniel Roe ([@danielroe](https://github.com/danielroe))
- Sébastien Chopin ([@atinux](https://github.com/atinux))

## v0.9.0

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.27...v0.9.0)

### 🚀 Enhancements

- Environments + env sync API ([#579](https://github.com/nuxt-hub/core/pull/579))

### 📖 Documentation

- Update nitro.unjs.io links to nitro.build ([#571](https://github.com/nuxt-hub/core/pull/571))

### ❤️ Contributors

- Farnabaz <farnabaz@gmail.com>
- Mr Kaashee <mrkaashee@gmail.com>

## v0.8.27

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.26...v0.8.27)

### 🚀 Enhancements

- Enable worker logs with default settings ([#566](https://github.com/nuxt-hub/core/pull/566))

### 📖 Documentation

- Update example ([e770eac](https://github.com/nuxt-hub/core/commit/e770eac))

### ❤️ Contributors

- Farnabaz <farnabaz@gmail.com>
- Sébastien Chopin <seb@nuxt.com>

## v0.8.26

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.25...v0.8.26)

### 🚀 Enhancements

- Autorag ([#541](https://github.com/nuxt-hub/core/pull/541))

### 📖 Documentation

- Update version ([6e99aa0](https://github.com/nuxt-hub/core/commit/6e99aa0))
- Add autorag changelog image ([#558](https://github.com/nuxt-hub/core/pull/558))

### 🏡 Chore

- **release:** V0.8.25 ([988a38b](https://github.com/nuxt-hub/core/commit/988a38b))
- Update to latest nuxt ui version ([#556](https://github.com/nuxt-hub/core/pull/556))

### ❤️ Contributors

- Rihan ([@RihanArfan](https://github.com/RihanArfan))
- Hugo Richard ([@HugoRCD](https://github.com/HugoRCD))
- Rihan Arfan ([@RihanArfan](https://github.com/RihanArfan))
- Sébastien Chopin ([@atinux](https://github.com/atinux))

## v0.8.25

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.24...v0.8.25)

### 🚀 Enhancements

- Support observability and additional bindings ([#549](https://github.com/nuxt-hub/core/pull/549))

### 📖 Documentation

- Browser rendering is now free ([bd54215](https://github.com/nuxt-hub/core/commit/bd54215))
- Fix hero image responsive ([#540](https://github.com/nuxt-hub/core/pull/540))
- Add workers changelog ([#542](https://github.com/nuxt-hub/core/pull/542))
- Update link ([8c8aa8c](https://github.com/nuxt-hub/core/commit/8c8aa8c))
- Fix nitro typo ([#544](https://github.com/nuxt-hub/core/pull/544))
- Update workers changelog image ([#547](https://github.com/nuxt-hub/core/pull/547))
- Fix mobile menu styling ([344855d](https://github.com/nuxt-hub/core/commit/344855d))
- Add observability changelog image ([#550](https://github.com/nuxt-hub/core/pull/550))
- Only link to feature if docs exist ([#543](https://github.com/nuxt-hub/core/pull/543))

### ❤️ Contributors

- Rihan ([@RihanArfan](https://github.com/RihanArfan))
- Hugo Richard ([@HugoRCD](https://github.com/HugoRCD))
- Sébastien Chopin ([@atinux](https://github.com/atinux))
- Leonardo Matos <leomp120894@gmail.com>

## v0.8.24

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.23...v0.8.24)

### 🚀 Enhancements

- Support hub.workers option ([#535](https://github.com/nuxt-hub/core/pull/535))

### 📖 Documentation

- LLMS Full generation ([#530](https://github.com/nuxt-hub/core/pull/530))
- Update deps ([866080d](https://github.com/nuxt-hub/core/commit/866080d))
- Use img tag ([6cfa14c](https://github.com/nuxt-hub/core/commit/6cfa14c))

### 🏡 Chore

- Small update ([147f1d5](https://github.com/nuxt-hub/core/commit/147f1d5))
- Update deps ([2a0f013](https://github.com/nuxt-hub/core/commit/2a0f013))
- Upgrade nuxt module builder to v1 ([#536](https://github.com/nuxt-hub/core/pull/536))
- Update deps ([6d0711f](https://github.com/nuxt-hub/core/commit/6d0711f))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](https://github.com/atinux))
- Rihan ([@RihanArfan](https://github.com/RihanArfan))
- Farnabaz <farnabaz@gmail.com>

## v0.8.23

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.21...v0.8.23)

### 🚀 Enhancements

- **ai:** Support AI gateway in development too ([#522](https://github.com/nuxt-hub/core/pull/522))
- Improve error logging in setup remote ([#492](https://github.com/nuxt-hub/core/pull/492))

### 🩹 Fixes

- **types:** Add exports in package.json ([#527](https://github.com/nuxt-hub/core/pull/527))

### 📖 Documentation

- Disable llms-full.txt for now ([30a521e](https://github.com/nuxt-hub/core/commit/30a521e))

### 🏡 Chore

- Update deps ([9bff98d](https://github.com/nuxt-hub/core/commit/9bff98d))
- Add postinstall script on playground ([3622d09](https://github.com/nuxt-hub/core/commit/3622d09))
- **release:** V0.8.22 ([3217c05](https://github.com/nuxt-hub/core/commit/3217c05))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](https://github.com/atinux))
- Rihan ([@RihanArfan](https://github.com/RihanArfan))

## v0.8.22

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.21...v0.8.22)

### 🚀 Enhancements

- **ai:** Support AI gateway in development too ([#522](https://github.com/nuxt-hub/core/pull/522))

### 📖 Documentation

- Disable llms-full.txt for now ([30a521e](https://github.com/nuxt-hub/core/commit/30a521e))

### 🏡 Chore

- Update deps ([9bff98d](https://github.com/nuxt-hub/core/commit/9bff98d))
- Add postinstall script on playground ([3622d09](https://github.com/nuxt-hub/core/commit/3622d09))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](https://github.com/atinux))

## v0.8.21

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.20...v0.8.21)

### 🩹 Fixes

- Typo `safe-buffer` -> `safer-buffer` ([e09663b](https://github.com/nuxt-hub/core/commit/e09663b))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](https://github.com/atinux))

## v0.8.20

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.19...v0.8.20)

### 🚀 Enhancements

- Send file mime to multi-part upload ([#518](https://github.com/nuxt-hub/core/pull/518))

### 🏡 Chore

- Add alias for safe-buffer to node:buffer ([39bc7ec](https://github.com/nuxt-hub/core/commit/39bc7ec))

### ❤️ Contributors

- Farnabaz <farnabaz@gmail.com>
- Sébastien Chopin ([@atinux](https://github.com/atinux))

## v0.8.19

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.18...v0.8.19)

### 🩹 Fixes

- **blob:** Missing content type on complete for multipart upload ([#517](https://github.com/nuxt-hub/core/pull/517))
- **ai:** Properly handle error data on streams ([e97ee16](https://github.com/nuxt-hub/core/commit/e97ee16))

### 📖 Documentation

- Update `@nuxt/content` and remove custom content components ([#490](https://github.com/nuxt-hub/core/pull/490))
- Fix syntax highlight ([c966784](https://github.com/nuxt-hub/core/commit/c966784))
- Add missing extension ([c666b9c](https://github.com/nuxt-hub/core/commit/c666b9c))

### 🏡 Chore

- Set `cloudflare.deployConfig` to false in nitro ([617f23d](https://github.com/nuxt-hub/core/commit/617f23d))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](https://github.com/atinux))
- Farnabaz <farnabaz@gmail.com>
- Hugo Richard ([@HugoRCD](https://github.com/HugoRCD))

## v0.8.18

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.17...v0.8.18)

### 📖 Documentation

- Update ai docs ([#461](https://github.com/nuxt-hub/core/pull/461))
- Update vectorize docs ([#458](https://github.com/nuxt-hub/core/pull/458))
- Add section for nuxthub deploy in ci/cd ([67fb252](https://github.com/nuxt-hub/core/commit/67fb252))
- Fix command palette navigation ([#476](https://github.com/nuxt-hub/core/pull/476))
- Tidy up content collections ([099c91b](https://github.com/nuxt-hub/core/commit/099c91b))
- Enable studio editing ([f056e7b](https://github.com/nuxt-hub/core/commit/f056e7b))
- Add LLMS routes ([f59c078](https://github.com/nuxt-hub/core/commit/f59c078))
- Add support for Nuxt Studio form customisation ([b5b1e54](https://github.com/nuxt-hub/core/commit/b5b1e54))
- Add blog & changelog on search ([ac962a9](https://github.com/nuxt-hub/core/commit/ac962a9))
- Improve environment variables part ([#478](https://github.com/nuxt-hub/core/pull/478))
- **gitlab-ci:** Adding gitlab-ci documentation ([#479](https://github.com/nuxt-hub/core/pull/479))
- Improvements on blog & changelog ([24e0efb](https://github.com/nuxt-hub/core/commit/24e0efb))
- Fix header gradient shows above all the content ([#483](https://github.com/nuxt-hub/core/pull/483), [#484](https://github.com/nuxt-hub/core/pull/484))
- 9K ([5fab003](https://github.com/nuxt-hub/core/commit/5fab003))

### 🏡 Chore

- Migrate to Nuxt UI v3 & Content v3 ([#471](https://github.com/nuxt-hub/core/pull/471))
- Add support for Nitro `nodeCompat` ([0c9eb8b](https://github.com/nuxt-hub/core/commit/0c9eb8b))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Mohamed <mohamedbenhamzaa@gmail.com>
- Skoenfaelt ([@skoenfaelt](http://github.com/skoenfaelt))
- Olivier Belaud ([@OlivierBelaud](http://github.com/OlivierBelaud))
- Hugo Richard ([@HugoRCD](http://github.com/HugoRCD))
- Matt Maribojoc <matthewmaribojoc@gmail.com>

## v0.8.17

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.16...v0.8.17)

### 🩹 Fixes

- Support upcoming nitro version ([c672f33](https://github.com/nuxt-hub/core/commit/c672f33))
- Add back cloudflare: as externals ([3f2aabe](https://github.com/nuxt-hub/core/commit/3f2aabe))

### 🏡 Chore

- Update deps ([0314365](https://github.com/nuxt-hub/core/commit/0314365))
- Move to pnpm 9 ([dff5b81](https://github.com/nuxt-hub/core/commit/dff5b81))
- Use pnpm 10 ([ed18f15](https://github.com/nuxt-hub/core/commit/ed18f15))

### ❤️ Contributors

- Sébastien Chopin <atinux@gmail.com>

## v0.8.16

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.15...v0.8.16)

### 🚀 Enhancements

- **db:** Support Nitro `useDatabase()` ([#15](https://github.com/nuxt-hub/core/pull/15))

### 🩹 Fixes

- Split sql trigger statements as a single query ([#451](https://github.com/nuxt-hub/core/pull/451))
- **blob:** Return null for get() with remote enabled ([#455](https://github.com/nuxt-hub/core/pull/455))

### 📖 Documentation

- 10 browser sessions now! ([cba9099](https://github.com/nuxt-hub/core/commit/cba9099))
- Kv, db, and cache updates ([#454](https://github.com/nuxt-hub/core/pull/454))

### 🏡 Chore

- **playground:** Add back basic auth ([915a180](https://github.com/nuxt-hub/core/commit/915a180))
- Disable durable preset for now ([b566b53](https://github.com/nuxt-hub/core/commit/b566b53))
- **playground:** Add websocket experimental flag ([1d5a8e0](https://github.com/nuxt-hub/core/commit/1d5a8e0))
- **playground:** Remove basic auth ([08239d7](https://github.com/nuxt-hub/core/commit/08239d7))
- **playground:** Use uncrypto instead ([03b6218](https://github.com/nuxt-hub/core/commit/03b6218))
- Fix ci for corepack ([dcef1c8](https://github.com/nuxt-hub/core/commit/dcef1c8))
- Add support for localhost on hub api routes ([824c998](https://github.com/nuxt-hub/core/commit/824c998))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Rihan ([@RihanArfan](http://github.com/RihanArfan))
- Matt Maribojoc <matthewmaribojoc@gmail.com>

## v0.8.15

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.14...v0.8.15)

### 🚀 Enhancements

- Prepare to CF Workers ([601034b](https://github.com/nuxt-hub/core/commit/601034b))

### 🏡 Chore

- Add nitroPreset in hub.config.json ([c2e29b3](https://github.com/nuxt-hub/core/commit/c2e29b3))

### ❤️ Contributors

- Sébastien Chopin <atinux@gmail.com>

## v0.8.14

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.13...v0.8.14)

### 🚀 Enhancements

- Add hub `test` env as well as supporting nuxt test option ([#429](https://github.com/nuxt-hub/core/pull/429))

### 🩹 Fixes

- Log relative path for hub dir ([c1cd2c3](https://github.com/nuxt-hub/core/commit/c1cd2c3))

### 📖 Documentation

- Update database migrations foreign keys constraints ([983e9c9](https://github.com/nuxt-hub/core/commit/983e9c9))
- Fix typo in debug ([#431](https://github.com/nuxt-hub/core/pull/431))

### 🏡 Chore

- Update deps ([965a9fa](https://github.com/nuxt-hub/core/commit/965a9fa))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Yizack Rangel ([@Yizack](http://github.com/Yizack))

## v0.8.13

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.12...v0.8.13)

### 🩹 Fixes

- **migrations:** Respect for loop for remote db migrations ([#426](https://github.com/nuxt-hub/core/pull/426))

### 🏡 Chore

- Update vitest ([3941629](https://github.com/nuxt-hub/core/commit/3941629))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.8.12

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.11...v0.8.12)

### 🚀 Enhancements

- **database:** Add support for multiple database migrations directories ([#423](https://github.com/nuxt-hub/core/pull/423))

### 🩹 Fixes

- **docs:** Migrations fragment identifier ([#417](https://github.com/nuxt-hub/core/pull/417))

### 📖 Documentation

- Remove using path as async data key ([0b15938](https://github.com/nuxt-hub/core/commit/0b15938))
- Remove using path as async data key" ([355a8ff](https://github.com/nuxt-hub/core/commit/355a8ff))
- Fix async data keys ([859a5f8](https://github.com/nuxt-hub/core/commit/859a5f8))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Yali ([@yusufalitangoz](http://github.com/yusufalitangoz))

## v0.8.11

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.10...v0.8.11)

### 🚀 Enhancements

- Add Open API tab in Nuxt Devtools with Scalar ([91d5016](https://github.com/nuxt-hub/core/commit/91d5016))

### 🩹 Fixes

- **api:** Disable cache and prerender on `/api/_hub/**` ([#414](https://github.com/nuxt-hub/core/pull/414))

### 📖 Documentation

- Add blog post about libsodium ([#400](https://github.com/nuxt-hub/core/pull/400))
- NuxtHub github action & app ([#390](https://github.com/nuxt-hub/core/pull/390))
- List supported package managers ([#407](https://github.com/nuxt-hub/core/pull/407))
- Add note for sync issue with private github repo ([46fc4e3](https://github.com/nuxt-hub/core/commit/46fc4e3))
- **deploy:** Correct path for linking repository to project and migration ti GH Actions ([#411](https://github.com/nuxt-hub/core/pull/411))

### 🏡 Chore

- Update deps ([#415](https://github.com/nuxt-hub/core/pull/415))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- GiveGet <giveget.ee@gmail.com>
- Rihan ([@RihanArfan](http://github.com/RihanArfan))

## v0.8.10

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.9...v0.8.10)

### 🩹 Fixes

- **vectorize:** Return `undefined` instead of throwing in dev with no remote ([#399](https://github.com/nuxt-hub/core/pull/399))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.8.9

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.8...v0.8.9)

### 🩹 Fixes

- **blob:** Handle `pdf` type correctly in `ensureBlob` ([#392](https://github.com/nuxt-hub/core/pull/392))
- **migration:** Invalid behavior while using `--` or `/* */` inside column string ([#397](https://github.com/nuxt-hub/core/pull/397))
- Register vectorize utils even if not running remotely ([#396](https://github.com/nuxt-hub/core/pull/396))

### 📖 Documentation

- **blob:** Proper input file type specifiers ([#393](https://github.com/nuxt-hub/core/pull/393))
- Improve postgres hyperdrive binding example ([#394](https://github.com/nuxt-hub/core/pull/394))

### 🏡 Chore

- Update deps ([f420340](https://github.com/nuxt-hub/core/commit/f420340))

### ❤️ Contributors

- Sébastien Chopin <atinux@gmail.com>
- Daniel Roe ([@danielroe](http://github.com/danielroe))
- Farnabaz <farnabaz@gmail.com>
- Gerben Mulder <github.undergo381@passmail.net>
- Yizack Rangel ([@Yizack](http://github.com/Yizack))

## v0.8.8

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.7...v0.8.8)

### 📖 Documentation

- Various improvements ([77c4de4](https://github.com/nuxt-hub/core/commit/77c4de4))
- Free plan is now 3MB ([f03e6ec](https://github.com/nuxt-hub/core/commit/f03e6ec))
- 7k ([21aa978](https://github.com/nuxt-hub/core/commit/21aa978))

### 🏡 Chore

- **playground:** Update compatibility date ([baf7b3b](https://github.com/nuxt-hub/core/commit/baf7b3b))
- **playground:** Add password for invoice ([f45a682](https://github.com/nuxt-hub/core/commit/f45a682))
- Add support for other cf presets ([d589d57](https://github.com/nuxt-hub/core/commit/d589d57))
- Update deps ([84bc2ff](https://github.com/nuxt-hub/core/commit/84bc2ff))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.8.7

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.6...v0.8.7)

### 🚀 Enhancements

- **cache:** Add support for swr detection ([#376](https://github.com/nuxt-hub/core/pull/376))

### 📖 Documentation

- Update blob.md to match the ensureBlob types ([#371](https://github.com/nuxt-hub/core/pull/371))

### 🏡 Chore

- Remove deprecated D1 dump() ([#373](https://github.com/nuxt-hub/core/pull/373))
- Update deps ([7532538](https://github.com/nuxt-hub/core/commit/7532538))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Mathieu NICOLAS ([@arkhaiel](http://github.com/arkhaiel))
- Rihan ([@RihanArfan](http://github.com/RihanArfan))

## v0.8.6

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.5...v0.8.6)

### 📖 Documentation

- Update to lucide ([e99ea45](https://github.com/nuxt-hub/core/commit/e99ea45))
- Small update ([2d2ea75](https://github.com/nuxt-hub/core/commit/2d2ea75))
- Fix system icon ([62e614c](https://github.com/nuxt-hub/core/commit/62e614c))

### 🏡 Chore

- Update deps ([2f39b34](https://github.com/nuxt-hub/core/commit/2f39b34))
- Update icons to lucide ([a81a5ad](https://github.com/nuxt-hub/core/commit/a81a5ad))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.8.5

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.4...v0.8.5)

### 🩹 Fixes

- Support nitro dir as priority instead of publicDir ([f21dfa1](https://github.com/nuxt-hub/core/commit/f21dfa1))
- **openapi:** Use new Nitro 2.10 format ([#365](https://github.com/nuxt-hub/core/pull/365))

### 📖 Documentation

- Add db migrations ([b5b66f9](https://github.com/nuxt-hub/core/commit/b5b66f9))
- Add note about preview and prod deployments ([b4cbe99](https://github.com/nuxt-hub/core/commit/b4cbe99))
- Use h3 instead ([7ad1fee](https://github.com/nuxt-hub/core/commit/7ad1fee))
- Typo index page ([#361](https://github.com/nuxt-hub/core/pull/361))
- Update `vectorize.dimensions` example to numbers ([#362](https://github.com/nuxt-hub/core/pull/362))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Max ([@onmax](http://github.com/onmax))
- Cyril ([@cyrilf](http://github.com/cyrilf))

## v0.8.4

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.3...v0.8.4)

### 🚀 Enhancements

- Support cloudflare access ([#348](https://github.com/nuxt-hub/core/pull/348))

### 📖 Documentation

- Add note about CF routes limit ([6556a74](https://github.com/nuxt-hub/core/commit/6556a74))

### 🏡 Chore

- Update deps ([afec71e](https://github.com/nuxt-hub/core/commit/afec71e))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Rihan ([@RihanArfan](http://github.com/RihanArfan))

## v0.8.3

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.2...v0.8.3)

### 🩹 Fixes

- Make vectorize query params optional ([#351](https://github.com/nuxt-hub/core/pull/351))
- Correctly resolve vectorize type ([#349](https://github.com/nuxt-hub/core/pull/349))
- Only show vectorize as remote storage if indexes present ([#352](https://github.com/nuxt-hub/core/pull/352))

### 📖 Documentation

- Let auto mode for color mode ([a823ba7](https://github.com/nuxt-hub/core/commit/a823ba7))
- Add back studio ([1826a4c](https://github.com/nuxt-hub/core/commit/1826a4c))

### ❤️ Contributors

- Rihan ([@RihanArfan](http://github.com/RihanArfan))
- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.8.2

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.1...v0.8.2)

### 🩹 Fixes

- Only apply migrations if database is enabled ([#343](https://github.com/nuxt-hub/core/pull/343))

### 📖 Documentation

- Improvements ([e0e493d](https://github.com/nuxt-hub/core/commit/e0e493d))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.8.1

[compare changes](https://github.com/nuxt-hub/core/compare/v0.8.0...v0.8.1)

### 🩹 Fixes

- **database:** Create migrations table in dev ([#342](https://github.com/nuxt-hub/core/pull/342))

### 📖 Documentation

- Improvements ([7806397](https://github.com/nuxt-hub/core/commit/7806397))
- Add example for the Todo App ([07adcd4](https://github.com/nuxt-hub/core/commit/07adcd4))
- Add example ([080708a](https://github.com/nuxt-hub/core/commit/080708a))
- Fix migrations hash ([#341](https://github.com/nuxt-hub/core/pull/341))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Estéban <e.soubiran25@gmail.com>

## v0.8.0

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.37...v0.8.0)

### 🚀 Enhancements

- ⚠️  Automatic database migrations ([#333](https://github.com/nuxt-hub/core/pull/333))

### 📖 Documentation

- 6K+ ([bd47e98](https://github.com/nuxt-hub/core/commit/bd47e98))
- It's 26th today ([f139730](https://github.com/nuxt-hub/core/commit/f139730))

### 🏡 Chore

- Update deps ([32ea9bb](https://github.com/nuxt-hub/core/commit/32ea9bb))

#### ⚠️ Breaking Changes

- ⚠️  Automatic database migrations ([#333](https://github.com/nuxt-hub/core/pull/333))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Rihan ([@RihanArfan](http://github.com/RihanArfan))

## v0.7.37

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.36...v0.7.37)

### 📖 Documentation

- Add note about CSP when serving blobs ([47448a2](https://github.com/nuxt-hub/core/commit/47448a2))

### 🏡 Chore

- Use `compiled` hook from nitro to final build event ([#338](https://github.com/nuxt-hub/core/pull/338))
- Update deps ([9fd90f4](https://github.com/nuxt-hub/core/commit/9fd90f4))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.36

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.35...v0.7.36)

### 🚀 Enhancements

- **blob:** Expose more data ([#337](https://github.com/nuxt-hub/core/pull/337))

### 🏡 Chore

- **playground:** Update deps ([3758f41](https://github.com/nuxt-hub/core/commit/3758f41))
- Update wrangler ([f1733d9](https://github.com/nuxt-hub/core/commit/f1733d9))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.35

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.34...v0.7.35)

### 🚀 Enhancements

- **cache:** Support batch delete ([#336](https://github.com/nuxt-hub/core/pull/336))

### 📖 Documentation

- Update `pg` note ([#332](https://github.com/nuxt-hub/core/pull/332))

### 🏡 Chore

- Update deps ([9c3bd45](https://github.com/nuxt-hub/core/commit/9c3bd45))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Sandro Circi ([@sandros94](http://github.com/sandros94))

## v0.7.34

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.33...v0.7.34)

### 🩹 Fixes

- Remove ttl if 0 ([1f67732](https://github.com/nuxt-hub/core/commit/1f67732))
- **blob:** Encode pathname ([#330](https://github.com/nuxt-hub/core/pull/330))
- Decode also in proxy ([b79b41c](https://github.com/nuxt-hub/core/commit/b79b41c))

### 🏡 Chore

- Fix test ([223f2f6](https://github.com/nuxt-hub/core/commit/223f2f6))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.33

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.32...v0.7.33)

### 🩹 Fixes

- Enable back AI in dev ([#327](https://github.com/nuxt-hub/core/pull/327))

### 🏡 Chore

- Update deps ([ef50db8](https://github.com/nuxt-hub/core/commit/ef50db8))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.32

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.31...v0.7.32)

### 🚀 Enhancements

- **blob:** Add `createCredentials()` to support presigned URLs ([#323](https://github.com/nuxt-hub/core/pull/323))

### 🩹 Fixes

- **blob:** Use `ensure` option if present ([#324](https://github.com/nuxt-hub/core/pull/324))

### ❤️ Contributors

- Johann Schopplich ([@johannschopplich](http://github.com/johannschopplich))
- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.31

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.30...v0.7.31)

### 🩹 Fixes

- **cache:** Driver not found with file:// ([#322](https://github.com/nuxt-hub/core/pull/322))

### 🏡 Chore

- Update deps ([8fd38d1](https://github.com/nuxt-hub/core/commit/8fd38d1))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.30

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.29...v0.7.30)

### 🩹 Fixes

- Remove extra base ([a05a8c7](https://github.com/nuxt-hub/core/commit/a05a8c7))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.29

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.28...v0.7.29)

### 🩹 Fixes

- **cache:** Smartly overwrite devStorage to handle pre-rendering ([#320](https://github.com/nuxt-hub/core/pull/320))

### 📖 Documentation

- Update social card ([a566d34](https://github.com/nuxt-hub/core/commit/a566d34))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.28

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.27...v0.7.28)

### 🩹 Fixes

- Update cache storage for pre-rendering phase ([#319](https://github.com/nuxt-hub/core/pull/319))
- Multipart with remote storage ([#318](https://github.com/nuxt-hub/core/pull/318))
- Normalize path for windows ([#317](https://github.com/nuxt-hub/core/pull/317))

### 📖 Documentation

- Show seed instructions ([cb2eb4e](https://github.com/nuxt-hub/core/commit/cb2eb4e))

### 🏡 Chore

- Fix types ([d05aa74](https://github.com/nuxt-hub/core/commit/d05aa74))
- Update deps ([2b7ee79](https://github.com/nuxt-hub/core/commit/2b7ee79))
- Lint fix ([3ffcfb2](https://github.com/nuxt-hub/core/commit/3ffcfb2))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.27

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.26...v0.7.27)

### 🚀 Enhancements

- Support cache expiration & improve admin speed ([#313](https://github.com/nuxt-hub/core/pull/313))

### 📖 Documentation

- Add linkedin links ([#309](https://github.com/nuxt-hub/core/pull/309))
- New landing page ([#310](https://github.com/nuxt-hub/core/pull/310))
- Minor updates ([11362aa](https://github.com/nuxt-hub/core/commit/11362aa))
- Seo title ([d442ad5](https://github.com/nuxt-hub/core/commit/d442ad5))
- Typos ([9b2514f](https://github.com/nuxt-hub/core/commit/9b2514f))
- Typos ([406fb95](https://github.com/nuxt-hub/core/commit/406fb95))

### 🏡 Chore

- Remove unused ai binding ([#308](https://github.com/nuxt-hub/core/pull/308))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Rihan ([@RihanArfan](http://github.com/RihanArfan))

## v0.7.26

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.25...v0.7.26)

### 🏡 Chore

- Update type ([17726d8](https://github.com/nuxt-hub/core/commit/17726d8))
- Add hub empty object to public runtime config ([97ec429](https://github.com/nuxt-hub/core/commit/97ec429))
- Remove unused type ([fb68769](https://github.com/nuxt-hub/core/commit/fb68769))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.25

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.24...v0.7.25)

### 🩹 Fixes

- Move tsconfig to correct folder ([#307](https://github.com/nuxt-hub/core/pull/307))

### 📖 Documentation

- Update version ([a214eb7](https://github.com/nuxt-hub/core/commit/a214eb7))
- Update changelog description ([78da207](https://github.com/nuxt-hub/core/commit/78da207))
- Improve readme ([3077181](https://github.com/nuxt-hub/core/commit/3077181))

### 🏡 Chore

- Add npx prefix for nuxthub commands ([aa13911](https://github.com/nuxt-hub/core/commit/aa13911))
- Leverage userProjectToken if available ([012f498](https://github.com/nuxt-hub/core/commit/012f498))
- Update deps ([ef4c6f4](https://github.com/nuxt-hub/core/commit/ef4c6f4))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Rihan ([@RihanArfan](http://github.com/RihanArfan))

## v0.7.24

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.23...v0.7.24)

### 🚀 Enhancements

- Add `hubVectorize()` ([#177](https://github.com/nuxt-hub/core/pull/177))

### 📖 Documentation

- Update AI pricing ([dd93ab1](https://github.com/nuxt-hub/core/commit/dd93ab1))
- Update date ([f643d6d](https://github.com/nuxt-hub/core/commit/f643d6d))

### 🏡 Chore

- **playground:** Update deps ([27b830c](https://github.com/nuxt-hub/core/commit/27b830c))
- Improve auth error message ([780ff7d](https://github.com/nuxt-hub/core/commit/780ff7d))
- Update deps ([3640368](https://github.com/nuxt-hub/core/commit/3640368))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Rihan ([@RihanArfan](http://github.com/RihanArfan))

## v0.7.23

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.22...v0.7.23)

### 🩹 Fixes

- Only set env if undefined at first ([fd779ee](https://github.com/nuxt-hub/core/commit/fd779ee))

### 🏡 Chore

- Remove unused import ([5173c1b](https://github.com/nuxt-hub/core/commit/5173c1b))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.22

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.21...v0.7.22)

### 🏡 Chore

- Use middleware instead of plugin ([f921892](https://github.com/nuxt-hub/core/commit/f921892))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.21

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.20...v0.7.21)

### 🚀 Enhancements

- Add noindex for preview env ([#296](https://github.com/nuxt-hub/core/pull/296))
- Remove trailing slash for prerender routes ([#298](https://github.com/nuxt-hub/core/pull/298))

### 🩹 Fixes

- Workaround for process.env and new node compat ([f28f549](https://github.com/nuxt-hub/core/commit/f28f549))

### 📖 Documentation

- Prerender dynamic pages using modules ([#300](https://github.com/nuxt-hub/core/pull/300))

### 🏡 Chore

- Use nitro compatibility flags by default ([#302](https://github.com/nuxt-hub/core/pull/302))
- Read and ignore nitro wrangler option ([#303](https://github.com/nuxt-hub/core/pull/303))
- Update deps ([6c3ca98](https://github.com/nuxt-hub/core/commit/6c3ca98))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Max ([@onmax](http://github.com/onmax))

## v0.7.20

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.19...v0.7.20)

### 🩹 Fixes

- **proxy:** Read env from request ([bd4de45](https://github.com/nuxt-hub/core/commit/bd4de45))

### 📖 Documentation

- Fix demo video modal ([785df95](https://github.com/nuxt-hub/core/commit/785df95))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.19

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.18...v0.7.19)

### 🚀 Enhancements

- Add `nuxthub preview` command ([#288](https://github.com/nuxt-hub/core/pull/288))

### 📖 Documentation

- Fix usage of `extends` ([9f4a5f0](https://github.com/nuxt-hub/core/commit/9f4a5f0))
- Update ([8e40b8d](https://github.com/nuxt-hub/core/commit/8e40b8d))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.18

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.17...v0.7.18)

### 🩹 Fixes

- Remove nuxthub cli dependency ([5d58b09](https://github.com/nuxt-hub/core/commit/5d58b09))

### 📖 Documentation

- Update ([101538b](https://github.com/nuxt-hub/core/commit/101538b))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.17

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.16...v0.7.17)

### 🩹 Fixes

- **blob:** Respect `addRandomSuffix` with remote access ([#287](https://github.com/nuxt-hub/core/pull/287))

### 📖 Documentation

- Various improvements ([fd3c5f0](https://github.com/nuxt-hub/core/commit/fd3c5f0))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.16

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.15...v0.7.16)

### 🚀 Enhancements

- **blob:** Add `.get()` ([#283](https://github.com/nuxt-hub/core/pull/283))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.15

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.14...v0.7.15)

### 🩹 Fixes

- Add browser binding on CF CI ([#281](https://github.com/nuxt-hub/core/pull/281))

### 📖 Documentation

- **recipes:** Fix typo ([#280](https://github.com/nuxt-hub/core/pull/280))

### 🏡 Chore

- **playground:** Disable v2 flag ([0950478](https://github.com/nuxt-hub/core/commit/0950478))

### ❤️ Contributors

- Cerino Ligutom III ([@cerinoligutom](http://github.com/cerinoligutom))
- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.14

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.13...v0.7.14)

### 🩹 Fixes

- Don't use global on client-side ([#278](https://github.com/nuxt-hub/core/pull/278))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.13

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.12...v0.7.13)

### 🩹 Fixes

- Use #imports for nitropack imports ([#276](https://github.com/nuxt-hub/core/pull/276))
- Move from `ni` to `nypm` ([#277](https://github.com/nuxt-hub/core/pull/277))

### 📖 Documentation

- Update image for remote storage ([517fc67](https://github.com/nuxt-hub/core/commit/517fc67))
- Simplify use cases ([01b9274](https://github.com/nuxt-hub/core/commit/01b9274))

### 🏡 Chore

- Update deps ([9e2d097](https://github.com/nuxt-hub/core/commit/9e2d097))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.12

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.11...v0.7.12)

### 🚀 Enhancements

- Add support for ALS ([#272](https://github.com/nuxt-hub/core/pull/272))

### 📖 Documentation

- Small update ([8f1d562](https://github.com/nuxt-hub/core/commit/8f1d562))
- Fix release date of hub browser ([116283e](https://github.com/nuxt-hub/core/commit/116283e))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.11

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.10...v0.7.11)

### 🚀 Enhancements

- Add support for browser rendering ([#271](https://github.com/nuxt-hub/core/pull/271))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.10

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.9...v0.7.10)

### 🚀 Enhancements

- **kv:** Add support for ttl ([#265](https://github.com/nuxt-hub/core/pull/265))
- Add support for defining compatibility date & flags ([#264](https://github.com/nuxt-hub/core/pull/264))

### 🩹 Fixes

- **blob:** Handle FileList in useUpload ([#260](https://github.com/nuxt-hub/core/pull/260))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Mohan G <mohangopavaram@gmail.com>

## v0.7.9

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.8...v0.7.9)

### 🚀 Enhancements

- Support `nuxt-csurf` with zero-config ([#256](https://github.com/nuxt-hub/core/pull/256))

### 📖 Documentation

- Handle login state in header ([759f065](https://github.com/nuxt-hub/core/commit/759f065))
- Dashboard button green ([e98b0a1](https://github.com/nuxt-hub/core/commit/e98b0a1))
- Add utm_source ([18b0ab0](https://github.com/nuxt-hub/core/commit/18b0ab0))

### 🏡 Chore

- Update deps ([e0d7a02](https://github.com/nuxt-hub/core/commit/e0d7a02))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.8

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.7...v0.7.8)

### 🩹 Fixes

- Correct typo in error message ([#251](https://github.com/nuxt-hub/core/pull/251))

### 📖 Documentation

- Update postgres ([3eda06a](https://github.com/nuxt-hub/core/commit/3eda06a))
- Add AI templates ([62661ad](https://github.com/nuxt-hub/core/commit/62661ad))
- Various improvements ([3274bf0](https://github.com/nuxt-hub/core/commit/3274bf0))
- Improve styling ([2756223](https://github.com/nuxt-hub/core/commit/2756223))
- Move features above ([4b32c7d](https://github.com/nuxt-hub/core/commit/4b32c7d))
- Document `useChat()` from Vercel AI SDK ([#250](https://github.com/nuxt-hub/core/pull/250))

### 🏡 Chore

- Lint fix ([6926f8c](https://github.com/nuxt-hub/core/commit/6926f8c))
- Update deps ([c0bfa9c](https://github.com/nuxt-hub/core/commit/c0bfa9c))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Rajeev R Sharma <i.rarsh@gmail.com>
- Rihan ([@RihanArfan](http://github.com/RihanArfan))

## v0.7.7

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.6...v0.7.7)

### 🩹 Fixes

- **blob:** Handle Uint8Array format ([#247](https://github.com/nuxt-hub/core/pull/247))

### 🏡 Chore

- Update deps ([19d3dfa](https://github.com/nuxt-hub/core/commit/19d3dfa))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.6

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.5...v0.7.6)

### 🚀 Enhancements

- Add support for extra bindings (Hyperdrive) ([#245](https://github.com/nuxt-hub/core/pull/245))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.5

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.4...v0.7.5)

### 🩹 Fixes

- Add support for `cloudflare:*` externals ([#243](https://github.com/nuxt-hub/core/pull/243))
- Disable the usage of `nuxt generate` ([#244](https://github.com/nuxt-hub/core/pull/244))

### 📖 Documentation

- Article about AI ([e3f7865](https://github.com/nuxt-hub/core/commit/e3f7865))
- Article ready ([956cc01](https://github.com/nuxt-hub/core/commit/956cc01))

### 🏡 Chore

- Update deps ([07cf4d4](https://github.com/nuxt-hub/core/commit/07cf4d4))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.4

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.3...v0.7.4)

### 🩹 Fixes

- **cache:** Don't force nitro prefix ([#239](https://github.com/nuxt-hub/core/pull/239))

### 📖 Documentation

- Add video on landing page ([7f450f1](https://github.com/nuxt-hub/core/commit/7f450f1))
- Fix usage ([d5d0864](https://github.com/nuxt-hub/core/commit/d5d0864))
- Update the logo ([dafa87a](https://github.com/nuxt-hub/core/commit/dafa87a))
- Add YouTube link ([8799f77](https://github.com/nuxt-hub/core/commit/8799f77))
- Add rss feeds ([ab4a627](https://github.com/nuxt-hub/core/commit/ab4a627))
- Improve landing page ([a777038](https://github.com/nuxt-hub/core/commit/a777038))
- Improve templates and add status page ([8af0745](https://github.com/nuxt-hub/core/commit/8af0745))
- Fix typos in article ([803591d](https://github.com/nuxt-hub/core/commit/803591d))
- Fix modal size ([e2d55c1](https://github.com/nuxt-hub/core/commit/e2d55c1))
- Add new testimonial ([ba7b541](https://github.com/nuxt-hub/core/commit/ba7b541))
- Update command palette links ([983ac18](https://github.com/nuxt-hub/core/commit/983ac18))
- Improve pricing page ([b4d8b80](https://github.com/nuxt-hub/core/commit/b4d8b80))
- Responsive improvements ([5fab28a](https://github.com/nuxt-hub/core/commit/5fab28a))
- No container needed for landing section ([b771fe5](https://github.com/nuxt-hub/core/commit/b771fe5))
- Add id for CF section ([92130ab](https://github.com/nuxt-hub/core/commit/92130ab))
- Ai is in CF workers ([644c3a8](https://github.com/nuxt-hub/core/commit/644c3a8))
- Update templates page ([2bb9786](https://github.com/nuxt-hub/core/commit/2bb9786))
- Particules particules ([be4f345](https://github.com/nuxt-hub/core/commit/be4f345))
- Improve hero ([f1593a9](https://github.com/nuxt-hub/core/commit/f1593a9))
- Improve last section ([dc54523](https://github.com/nuxt-hub/core/commit/dc54523))
- Update readme ([9445cd1](https://github.com/nuxt-hub/core/commit/9445cd1))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.3

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.2...v0.7.3)

### 🩹 Fixes

- **blob:** Support customMetadata in proxy on `put()` ([#231](https://github.com/nuxt-hub/core/pull/231))

### 📖 Documentation

- HubAI() minimum version and image opti ([1cebec3](https://github.com/nuxt-hub/core/commit/1cebec3))
- Use the right date ([521662a](https://github.com/nuxt-hub/core/commit/521662a))
- More improvements ([efe912f](https://github.com/nuxt-hub/core/commit/efe912f))
- Update image sizes ([287d678](https://github.com/nuxt-hub/core/commit/287d678))
- Update changelog ([bc895d6](https://github.com/nuxt-hub/core/commit/bc895d6))
- Prerender /api/changelog.json ([7a3627c](https://github.com/nuxt-hub/core/commit/7a3627c))

### 🏡 Chore

- **playground:** Fix database reactivity ([5b3b2a8](https://github.com/nuxt-hub/core/commit/5b3b2a8))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))

## v0.7.2

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.1...v0.7.2)

### 🚀 Enhancements

- Add hubAI() ([#173](https://github.com/nuxt-hub/core/pull/173))

### 🩹 Fixes

- Support remote overwrites ([9b434eb](https://github.com/nuxt-hub/core/commit/9b434eb))

### 📖 Documentation

- Deploy button ([ca132e7](https://github.com/nuxt-hub/core/commit/ca132e7))
- Add deploy button changelog ([e9ecf1f](https://github.com/nuxt-hub/core/commit/e9ecf1f))
- **changelog:** Small update ([9fcc96b](https://github.com/nuxt-hub/core/commit/9fcc96b))
- Update Cloudflare KV included usage information ([#206](https://github.com/nuxt-hub/core/pull/206))
- Fix typo ([#212](https://github.com/nuxt-hub/core/pull/212))
- Add deploy section ([91a1d97](https://github.com/nuxt-hub/core/commit/91a1d97))
- Add debug recipe ([784fd58](https://github.com/nuxt-hub/core/commit/784fd58))
- **recipe:** Update debug header ([dad8793](https://github.com/nuxt-hub/core/commit/dad8793))
- Add postinstall script ([f1ce27e](https://github.com/nuxt-hub/core/commit/f1ce27e))
- Article about atidraw ([#225](https://github.com/nuxt-hub/core/pull/225))
- Fix blog breadcrumb responsive ([b9d2faa](https://github.com/nuxt-hub/core/commit/b9d2faa))
- Update steps illustrations ([cba1af7](https://github.com/nuxt-hub/core/commit/cba1af7))

### 🏡 Chore

- **release:** V0.7.1 ([a4377db](https://github.com/nuxt-hub/core/commit/a4377db))
- Fix typo in analytics.ts ([#198](https://github.com/nuxt-hub/core/pull/198))
- Uncomment pkg.pr.new ([#197](https://github.com/nuxt-hub/core/pull/197))
- Disable prettier ([#226](https://github.com/nuxt-hub/core/pull/226))
- **test:** More limit to timeout ([9cffde4](https://github.com/nuxt-hub/core/commit/9cffde4))

### ❤️ Contributors

- Sébastien Chopin ([@atinux](http://github.com/atinux))
- Rihan ([@RihanArfan](http://github.com/RihanArfan))
- Estéban <e.soubiran25@gmail.com>
- Linzhe ([@linzhe141](http://github.com/linzhe141))
- Tom Taylor <tom@twisted.digital>
- Mohammad Bagher Abiyat ([@Aslemammad](http://github.com/Aslemammad))
- 面条 ([@ccbikai](http://github.com/ccbikai))
- Farnabaz <farnabaz@gmail.com>

## v0.7.1

[compare changes](https://github.com/nuxt-hub/core/compare/v0.7.0...v0.7.1)

### 🩹 Fixes

- **cache:** Handle cache keys with `.` ([#196](https://github.com/nuxt-hub/core/pull/196))
- **openapi:** Use direct import instead of nitro alias ([#192](https://github.com/nuxt-hub/core/pull/192))

### 📖 Documentation

- Improvements ([c092ede](https://github.com/nuxt-hub/core/commit/c092ede))
- Add jsdoc for useUpload ([3f66ac0](https://github.com/nuxt-hub/core/commit/3f66ac0))
- Add GitHub Action example ([f1e91f8](https://github.com/nuxt-hub/core/commit/f1e91f8))
- Use nuxthub discord invite ([#188](https://github.com/nuxt-hub/core/pull/188))
- Update pricing ([8028dae](https://github.com/nuxt-hub/core/commit/8028dae))
- Add blob upload prefix ([2feff31](https://github.com/nuxt-hub/core/commit/2feff31))
- Update images for steps ([aed88b1](https://github.com/nuxt-hub/core/commit/aed88b1))
- Use event.path instead of event.node.req.url ([#195](https://github.com/nuxt-hub/core/pull/195))
- Missing pnpm version on github actions template ([#194](https://github.com/nuxt-hub/core/pull/194))

### 🏡 Chore

- **release:** V0.7.0 ([314fd54](https://github.com/nuxt-hub/core/commit/314fd54))
- Fix playground with new nuxt shallow ref ([b2adb87](https://github.com/nuxt-hub/core/commit/b2adb87))
- Update deploy command to npx nuxthub deploy ([ef43572](https://github.com/nuxt-hub/core/commit/ef43572))

### ❤️ Contributors

- Farnabaz <farnabaz@gmail.com>
- Michel EDIGHOFFER <edimitchel@gmail.com>
- Alexander Lichter ([@manniL](http://github.com/manniL))
- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Rihan ([@RihanArfan](http://github.com/RihanArfan))

## v0.7.0

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.17...v0.7.0)

### 🚀 Enhancements

- **blob:** ⚠️  Change API for consistency ([#187](https://github.com/nuxt-hub/core/pull/187))

### 📖 Documentation

- Add Hello Edge template ([7c9e805](https://github.com/nuxt-hub/core/commit/7c9e805))
- Update og image ([7ba4dba](https://github.com/nuxt-hub/core/commit/7ba4dba))
- Improve ctas ([099fcbd](https://github.com/nuxt-hub/core/commit/099fcbd))
- Try public sans font ([05fcfea](https://github.com/nuxt-hub/core/commit/05fcfea))
- Add parent routes for header active links ([47a7331](https://github.com/nuxt-hub/core/commit/47a7331))
- Improve drizzle seed example ([#176](https://github.com/nuxt-hub/core/pull/176))
- **recipes:** Remove extra field for drizzle seed ([a8a8b01](https://github.com/nuxt-hub/core/commit/a8a8b01))

### 🏡 Chore

- Update pricing ([b127a38](https://github.com/nuxt-hub/core/commit/b127a38))
- Update deps ([5b30feb](https://github.com/nuxt-hub/core/commit/5b30feb))

#### ⚠️ Breaking Changes

- **blob:** ⚠️  Change API for consistency ([#187](https://github.com/nuxt-hub/core/pull/187))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Mohammed ([@redcodemohammed](http://github.com/redcodemohammed))

## v0.6.17

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.16...v0.6.17)

### 🏡 Chore

- **dx:** Require `wrangler` only when required ([04efdfa](https://github.com/nuxt-hub/core/commit/04efdfa))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.6.16

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.15...v0.6.16)

### 🩹 Fixes

- **blob:** Check correct variable in useUpload ([889acbc](https://github.com/nuxt-hub/core/commit/889acbc))

### 📖 Documentation

- Add team-webhooks-env selection ([8b27277](https://github.com/nuxt-hub/core/commit/8b27277))

### 🏡 Chore

- **ci:** Add pkg.pr.new for package preview on pull requests ([#164](https://github.com/nuxt-hub/core/pull/164))
- Update deps ([f55098c](https://github.com/nuxt-hub/core/commit/f55098c))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Mohammad Bagher Abiyat ([@Aslemammad](http://github.com/Aslemammad))

## v0.6.15

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.14...v0.6.15)

### 🩹 Fixes

- Import runtime types from `@nuxthub/core` ([#168](https://github.com/nuxt-hub/core/pull/168))

### 🏡 Chore

- **release:** V0.6.14 ([8351707](https://github.com/nuxt-hub/core/commit/8351707))
- Improve server types ([#160](https://github.com/nuxt-hub/core/pull/160))

### ❤️ Contributors

- Daniel Roe ([@danielroe](http://github.com/danielroe))
- Estéban <e.soubiran25@gmail.com>
- Farnabaz <farnabaz@gmail.com>

## v0.6.14

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.13...v0.6.14)

### ✅ Tests

- Improve tests and integrity ([#163](https://github.com/nuxt-hub/core/pull/163))

### ❤️ Contributors

- Farnabaz <farnabaz@gmail.com>

## v0.6.13

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.11...v0.6.13)

### 🚀 Enhancements

- Optimize bundle ([#138](https://github.com/nuxt-hub/core/pull/138))

### 🩹 Fixes

- **blob:** Remove slugify ([#154](https://github.com/nuxt-hub/core/pull/154))
- **module:** Invalid resolved path in npm package ([#161](https://github.com/nuxt-hub/core/pull/161))
- **analytics:** Setup analytics worker ([#162](https://github.com/nuxt-hub/core/pull/162))

### 📖 Documentation

- Remove extra + ([bf850fe](https://github.com/nuxt-hub/core/commit/bf850fe))

### 🏡 Chore

- **release:** V0.6.11 ([a7bdb0c](https://github.com/nuxt-hub/core/commit/a7bdb0c))
- **action:** Add pr version release ([415e9a3](https://github.com/nuxt-hub/core/commit/415e9a3))
- Disable pkg-pr-new ([fcb2994](https://github.com/nuxt-hub/core/commit/fcb2994))
- **release:** V0.6.12 ([389a633](https://github.com/nuxt-hub/core/commit/389a633))

### ❤️ Contributors

- Farnabaz <farnabaz@gmail.com>
- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Quandabase ([@quandabase](http://github.com/quandabase))

## v0.6.12

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.11...v0.6.12)

### 🚀 Enhancements

- Optimize bundle ([#138](https://github.com/nuxt-hub/core/pull/138))

### 🩹 Fixes

- **blob:** Remove slugify ([#154](https://github.com/nuxt-hub/core/pull/154))

### 📖 Documentation

- Remove extra + ([bf850fe](https://github.com/nuxt-hub/core/commit/bf850fe))

### 🏡 Chore

- **action:** Add pr version release ([415e9a3](https://github.com/nuxt-hub/core/commit/415e9a3))
- Disable pkg-pr-new ([fcb2994](https://github.com/nuxt-hub/core/commit/fcb2994))

### ❤️ Contributors

- Farnabaz <farnabaz@gmail.com>
- Quandabase ([@quandabase](http://github.com/quandabase))
- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.6.11

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.10...v0.6.11)

### 🩹 Fixes

- **blob:** Missing import and fix types for `useUpload` ([#156](https://github.com/nuxt-hub/core/pull/156))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.6.10

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.9...v0.6.10)

### 🩹 Fixes

- **handleUpload:** Ensure valid http method ([#148](https://github.com/nuxt-hub/core/pull/148))
- Support upcoming nitro release ([475fa04](https://github.com/nuxt-hub/core/commit/475fa04))

### 🏡 Chore

- Update deps ([0e5100f](https://github.com/nuxt-hub/core/commit/0e5100f))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Farnabaz <farnabaz@gmail.com>

## v0.6.9

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.8...v0.6.9)

### 🚀 Enhancements

- Use etag in blob.serve ([#147](https://github.com/nuxt-hub/core/pull/147))

### 🩹 Fixes

- **blob:** Set correct customMetadata ([#146](https://github.com/nuxt-hub/core/pull/146))

### ❤️ Contributors

- Murzin Artem ([@FutureExcited](http://github.com/FutureExcited))
- Estéban <e.soubiran25@gmail.com>

## v0.6.8

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.7...v0.6.8)

### 🩹 Fixes

- **blob:** Sanitize pathname to avoid doubleslash ([2079b6a](https://github.com/nuxt-hub/core/commit/2079b6a))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.6.7

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.6...v0.6.7)

### 🩹 Fixes

- **blob:** Add last missing import ([8cb7866](https://github.com/nuxt-hub/core/commit/8cb7866))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.6.6

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.5...v0.6.6)

### 🩹 Fixes

- Missing imports for blob & multipart ([36a8e66](https://github.com/nuxt-hub/core/commit/36a8e66))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.6.5

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.4...v0.6.5)

### 🩹 Fixes

- Blobs & cors issue ([#145](https://github.com/nuxt-hub/core/pull/145))

### 📖 Documentation

- Announce public beta ([#56](https://github.com/nuxt-hub/core/pull/56))
- Update serve example ([3a06bed](https://github.com/nuxt-hub/core/commit/3a06bed))
- Add drizzle studio update ([4772f65](https://github.com/nuxt-hub/core/commit/4772f65))
- Update video size ([e79a30a](https://github.com/nuxt-hub/core/commit/e79a30a))

### 🏡 Chore

- Update deps ([a2b0d93](https://github.com/nuxt-hub/core/commit/a2b0d93))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))
- Farnabaz <farnabaz@gmail.com>
- Florent Delerue <florentdelerue@hotmail.com>

## v0.6.4

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.3...v0.6.4)

### 🩹 Fixes

- **blob:** Add missing import for getQuery ([56e69e0](https://github.com/nuxt-hub/core/commit/56e69e0))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.6.3

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.2...v0.6.3)

### 🩹 Fixes

- Ensure env is set before calling `projectUrl()` ([40dfa3d](https://github.com/nuxt-hub/core/commit/40dfa3d))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.6.2

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.1...v0.6.2)

### 🩹 Fixes

- **manifest:** Handle new format with list() ([0496a29](https://github.com/nuxt-hub/core/commit/0496a29))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

## v0.6.1

[compare changes](https://github.com/nuxt-hub/core/compare/v0.6.0...v0.6.1)

### 🩹 Fixes

- **blob:** Add missing readFormData import ([fbfb8af](https://github.com/nuxt-hub/core/commit/fbfb8af))

### 🏡 Chore

- **types:** Add missing imports ([9b81e7e](https://github.com/nuxt-hub/core/commit/9b81e7e))

### ❤️ Contributors

- Sébastien Chopin ([@Atinux](http://github.com/Atinux))

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

