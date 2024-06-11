import { cachedEventHandler } from 'nitropack/runtime'

export default cachedEventHandler(async () => {
  return { hello: 'world' }
}, {
  maxAge: 1000
})
