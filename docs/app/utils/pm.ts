export const packageManagers = [
  { name: 'pnpm', command: 'pnpm', install: 'add ', devInstall: 'add -D ', run: '', x: 'pnpm dlx ' },
  { name: 'yarn', command: 'yarn', install: 'add ', devInstall: 'add -D ', run: '', x: 'yarn dlx ' },
  { name: 'npm', command: 'npm', install: 'install ', devInstall: 'install -D ', run: 'run ', x: 'npx ' },
  { name: 'bun', command: 'bun', install: 'add ', devInstall: 'add -D ', run: 'run ', x: 'bunx ' },
  { name: 'deno', command: 'deno', install: 'add npm:', devInstall: 'add -D npm:', run: 'run ', x: 'deno run -A npm:' },
  { name: 'auto', command: 'npx nypm', install: 'add ', devInstall: 'add -D ', run: 'run ', x: 'npx ' }
] as const
