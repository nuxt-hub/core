import { consola } from 'consola'
import { isCancel, select, text } from '@clack/prompts'
import { joinURL } from 'ufo'
import { ofetch } from 'ofetch'
import { NUXT_HUB_URL, loadUserConfig, loadProjectConfig } from './config.mjs'

export const $api = ofetch.create({
  baseURL: joinURL(NUXT_HUB_URL, '/api'),
  onRequest({ options }) {
    options.headers = options.headers || {}
    if (!options.headers.Authorization) {
      options.headers.Authorization = `Bearer ${loadUserConfig().hub?.userToken || ''}`
    }
  },
  onResponseError(ctx) {
    if (ctx.response._data?.message) {
      consola.error(ctx.response._data?.message)
      process.exit(1)
    }
  }
})

export function fetchUser() {
  if (!loadUserConfig().hub?.userToken) {
    return null
  }
  return $api('/user').catch(() => null)
}

export async function selectTeam() {
  const teams = await $api('/teams')
  let team
  if (teams.length > 1) {
    const teamId = await select({
      message: 'Select a team',
      options: teams.map((team) => ({
        value: team.id,
        label: team.name
      }))
    })
    if (isCancel(teamId)) return null
    team = teams.find((team) => team.id === teamId)
  } else {
    team = teams[0]
  }
  return team
}

export async function selectProject(team) {
  const projects = await $api(`/teams/${team.slug}/projects`)
  const projectId = await select({
    message: 'Select a project',
    options: [
      { value: 'new', label: 'Create a new project' },
      ...projects.map((project) => ({
        value: project.id,
        label: project.slug
      }))
    ]
  })
  if (isCancel(projectId)) return null

  let project
  if (projectId === 'new') {
    const projectName = await text({
      message: 'Project name',
      placeholder: 'my-nuxt-project'
    })
    if (!projectName || isCancel(projectName)) return null
    project = await $api(`/teams/${team.slug}/projects`, {
      method: 'POST',
      body: { name: projectName }
    })
    consola.success(`Project \`${project.slug}\` created`)
  } else {
    project = projects.find((project) => project.id === projectId)
  }

  return project
}

export async function fetchProject() {
  const projectConfig = loadProjectConfig()
  if (projectConfig.hub?.projectId) {
    return $api(`/projects/${projectConfig.hub.projectId}`).catch(() => null)
  }
  return null
}
