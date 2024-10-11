const test = defineCachedFunction((_event) => {
  return 'test'
}, {
  getKey: () => 'test'
})

export default cachedEventHandler(async (event) => {
  return {
    now: Date.now(),
    test: test(event)
  }
}, {
  maxAge: 10,
  swr: true
})
