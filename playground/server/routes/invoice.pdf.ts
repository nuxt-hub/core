export default eventHandler(async (event) => {
  const { page } = await hubBrowser()
  await page.goto(`${getRequestURL(event).origin}/_invoice`)

  setHeader(event, 'Content-Type', 'application/pdf')
  return page.pdf({ format: 'A4' })
})
