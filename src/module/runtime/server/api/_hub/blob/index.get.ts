import { eventHandler } from 'h3'

export default eventHandler(async () => {
  return hubBlob().list()
})
