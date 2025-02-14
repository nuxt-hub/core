export default eventHandler(async (event) => {
  return queryCollection(event, 'changelog')
    .order('date', 'DESC')
    .limit(10)
    .select('title', 'date', 'image', 'description', 'path', 'extension')
    .all()
})
