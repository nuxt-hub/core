import { kv } from 'hub:kv'

export default eventHandler(async () => {
  // await kv.set('vue', { year: 2014 })
  await kv.set('vue:nuxt', { year: 2016 })
  await kv.set('vue:quasar', { version: 2015 })
  // await kv.set('react', { version: 2013 })
  await kv.set('react:next', { version: 2016 })
  await kv.set('react:gatsby', { version: 2015 })

  return kv.keys()
})
