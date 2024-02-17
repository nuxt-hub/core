import { consola } from 'consola'
import { colors } from 'consola/utils'
import { isCancel, confirm } from '@clack/prompts'
import { defineCommand, runCommand } from 'citty'
import { fetchUser, selectTeam, selectProject, projectPath, updateProjectConfig, fetchProject } from '../utils/index.mjs'
import login from './login.mjs'

export default defineCommand({
  meta: {
    name: 'link',
    description: 'Link a local directory to a NuxtHub project.',
  },
  async setup() {
    let user = await fetchUser()
    if (!user) {
      consola.info('Please login to link your project.')
      await runCommand(login, {})
      user = await fetchUser()
    }
    let project = await fetchProject()
    if (project) {
      consola.warn(`This directory is already linked to the \`${project.slug}\` project.`)

      const linkAnyway = await confirm({
        message: `Do you want to link ${colors.blue(projectPath())} to another project?`,
        initialValue: false
      })
      if (!linkAnyway || isCancel(linkAnyway)) {
        return
      }
    } else {
      const shouldLink = await confirm({
        message: `Link ${colors.blue(projectPath())} to NuxtHub?`
      })
      if (!shouldLink || isCancel(shouldLink)) {
        return consola.log('Cancelled.')
      }
    }

    const team = await selectTeam()
    if (!team) return

    project = await selectProject(team)

    updateProjectConfig({
      hub: {
        projectId: project.id
      }
    })

    consola.success(`Project \`${project.slug}\` linked.`)
  },
})
