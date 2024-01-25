import { createH3StorageHandler } from 'unstorage/server'

export default eventHandler(async (event) => {
  const storage = useKV()
  return createH3StorageHandler(storage, {
    resolvePath(event) {
      return event.context.params!.path || ''
    }
  })(event)
})
