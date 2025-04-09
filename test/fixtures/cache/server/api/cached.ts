import { defineCachedEventHandler } from '#imports'

export default defineCachedEventHandler(async () => {
  return { hello: 'world' }
}, {
  maxAge: 1000
})
