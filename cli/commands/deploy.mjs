import { consola } from 'consola'
import { colors } from 'consola/utils'
import { isCancel, confirm, select, text } from '@clack/prompts'
import { defineCommand, runCommand } from 'citty'
import { loadConfig } from '../utils.mjs'
import { $api } from '../utils.mjs'
import login from './login.mjs'
import { homedir } from 'os'

export default defineCommand({
  meta: {
    name: 'deploy',
    description: 'Deploy your project to NuxtHub.',
  },
  async setup() {
    const config = loadConfig()
    if (!config.token) {
      consola.info('You need to be logged in to deploy your project.')
      const res = await runCommand(login, {})
      console.log('res', res)
    }
    const shouldDeploy = await confirm({
      message: `Deploy ${colors.blue(process.cwd().replace(homedir(), '~'))} to NuxtHub?`
    })
    if (!shouldDeploy || isCancel(shouldDeploy)) {
      return consola.log('Cancelled.')
    }

    const teams = await $api('/teams')
    const teamId = await select({
      message: 'Select a team',
      options: teams.map((team) => ({
        value: team.id,
        label: team.name
      }))
    })
    if (isCancel(teamId)) return
    const team = teams.find((team) => team.id === teamId)

    const projects = await $api(`/teams/${team.slug}/projects`)
    const projectId = await select({
      message: 'Link a project',
      options: [
        { value: 'new', label: 'Create a new project' },
        ...projects.map((project) => ({
          value: project.id,
          label: project.slug
        }))
      ]
    })
    if (isCancel(projectId)) return

    let project
    if (projectId === 'new') {
      const projectName = await text({
        message: 'Project name',
        placeholder: 'my-nuxt-project'
      })
      if (isCancel(projectName)) return
      project = await $api(`/teams/${team.slug}/projects`, {
        method: 'POST',
        body: { name: projectName }
      })
      consola.success(`Project \`${project.slug}\` created`)
    } else {
      project = projects.find((project) => project.id === projectId)
    }

    consola.info(`Deploying \`${project.slug}\` to NuxtHub...`)
  },
})
