const test = defineCachedFunction(() => {
  return 'test'
}, {
  getKey: () => 'test'
})

export default cachedEventHandler(async () => {
  return {
    now: Date.now(),
    test: test()
  }
}, {
  maxAge: 10,
  swr: true
})
