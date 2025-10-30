#!/usr/bin/env node
import { defineCommand } from 'citty'
import database from './commands/database.mjs'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))

export const main = defineCommand({
  meta: {
    name: 'nuxthub',
    description: 'NuxtHub CLI',
    version: version
  },
  subCommands: {
    database
  }
})
