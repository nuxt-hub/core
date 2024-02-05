export default eventHandler(async (event) => {
  const config = await _fetchConfig(event)

  event.context.hub = {
    config
  }
})
