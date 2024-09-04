export default eventHandler(async () => {
  return $fetch('https://admin.hub.nuxt.com/api/templates')
})
