import { serverQueryContent } from '#content/server'

export default eventHandler(async (event) => {
  return serverQueryContent(event, 'changelog').where({
    _type: 'markdown',
    navigation: { $ne: false }
  })
    .sort({ date: -1 })
    .limit(10)
    .only(['title', 'date', 'image', 'description', '_path'])
    .find()
})
