import { defineEventHandler, getRouterParams } from 'nuxt/server'
import { blob } from '@nuxthub/blob'

export default defineEventHandler(async (event) => {
  const { pathname } = getRouterParams(event)

  event.res.headers.set('Content-Security-Policy', 'default-src \'none\';')
  return blob.serve(event, pathname!)
})
