const test = defineCachedFunction(() => {
  return 'test'
}, {
  getKey: () => 'test'
})

export default cachedEventHandler(async () => {
  return {
    now: Date.now(),
    test: await test()
  }
}, {
  maxAge: 10,
  swr: true
})
