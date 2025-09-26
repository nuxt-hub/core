#!/usr/bin/env node
import { defineCommand } from 'citty'
import { version } from '../package.json'
import { consola } from 'consola'
import { colors } from 'consola/utils'
import database from './commands/database'

export const main = defineCommand({
  meta: {
    name: 'nuxthub',
    description: 'NuxtHub CLI',
    version: version
  },
  setup({ args, cmd }) {
    if (args._.length) {
      consola.log(colors.gray(`${cmd.meta?.description}`))
    }
  },
  subCommands: {
    database
  }
})
