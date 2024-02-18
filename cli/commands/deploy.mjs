import { consola } from 'consola'
import { colors } from 'consola/utils'
import { isCancel, confirm } from '@clack/prompts'
import { defineCommand, runCommand } from 'citty'
import { fetchUser, selectTeam, selectProject, projectPath, fetchProject } from '../utils/index.mjs'
import login from './login.mjs'

export default defineCommand({
  meta: {
    name: 'deploy',
    description: 'Deploy your project to NuxtHub.',
  },
  async setup() {
    let user = await fetchUser()
    if (!user) {
      consola.info('Please login to deploy your project.')
      await runCommand(login, {})
      user = await fetchUser()
    }
    let project = await fetchProject()
    // If the project is not linked
    if (!project) {
      const shouldDeploy = await confirm({
        message: `Deploy ${colors.blue(projectPath())} to NuxtHub?`
      })
      if (!shouldDeploy || isCancel(shouldDeploy)) {
        return consola.log('Cancelled.')
      }

      const team = await selectTeam()
      if (!team) return

      project = await selectProject(team)
      if (!project) return consola.log('Cancelled.')
    }

    consola.info(`Deploying \`${project.slug}\` to NuxtHub...`)
  },
})
