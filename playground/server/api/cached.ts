export default cachedEventHandler(async () => {
  return {
    now: Date.now()
  }
}, {
  maxAge: 10
})
