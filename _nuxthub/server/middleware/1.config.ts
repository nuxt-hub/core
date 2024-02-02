export default eventHandler(async (event) => {
  event.context.config = await _fetchConfig()
})
