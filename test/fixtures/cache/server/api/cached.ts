import { defineCachedEventHandler } from 'nitropack/runtime'

export default defineCachedEventHandler(async () => {
  return { hello: 'world' }
}, {
  maxAge: 1000
})
