export default cachedEventHandler(async (event) => {
  return {
    now: Date.now()
  }
}, {
  maxAge: 10
})
