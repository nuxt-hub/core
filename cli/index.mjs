#!/usr/bin/env node
import { defineCommand, runMain } from 'citty'
import consola from 'consola'
import { colors } from 'consola/utils'
import link from './commands/link.mjs'
import unlink from './commands/unlink.mjs'
import login from './commands/login.mjs'
import logout from './commands/logout.mjs'
import whoami from './commands/whoami.mjs'
import deploy from './commands/deploy.mjs'

const main = defineCommand({
  meta: {
    name: 'nuxthub',
    description: 'NuxtHub CLI'
  },
  setup({ args, cmd }) {
    if (args._.length) {
      consola.log(colors.gray(`${cmd.meta.description}`))
    }
  },
  subCommands: {
    deploy,
    link,
    unlink,
    login,
    logout,
    whoami
  },
})

runMain(main)
