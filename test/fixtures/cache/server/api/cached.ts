import { cachedEventHandler } from '#imports'

export default cachedEventHandler(async () => {
  return { hello: 'world' }
}, {
  maxAge: 1000
})
