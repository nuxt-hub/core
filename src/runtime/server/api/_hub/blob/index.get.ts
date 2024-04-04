import { eventHandler } from 'h3'
import { hubBlob } from '../../../utils/blob'

export default eventHandler(async () => {
  return hubBlob().list()
})
