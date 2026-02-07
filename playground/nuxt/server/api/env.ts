export default eventHandler(async () => {
  return {
    test: true,
    projectKey: process.env.NUXT_HUB_PROJECT_KEY
  }
})
