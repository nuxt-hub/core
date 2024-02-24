import { eventHandler } from 'h3'
import { useBlob } from '../../../utils/blob'

export default eventHandler(async () => {
  return useBlob().list()
})
