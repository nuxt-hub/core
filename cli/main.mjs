#!/usr/bin/env node
import { defineCommand } from 'citty'
import db from './commands/db.mjs'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))

export const main = defineCommand({
  meta: {
    name: 'hub',
    description: 'NuxtHub CLI',
    version: version
  },
  subCommands: {
    db
  }
})
