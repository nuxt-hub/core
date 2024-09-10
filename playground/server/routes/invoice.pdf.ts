import { joinURL } from 'ufo'

export default eventHandler(async (event) => {
  const { page } = await hubBrowser()
  const url = joinURL(getRequestURL(event).origin, '/_invoice')
  await page.goto(url)

  setHeader(event, 'Content-Type', 'application/pdf')
  return page.createPDFStream({ format: 'A4' })
})
