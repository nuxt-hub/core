export default eventHandler(async (event) => {
  const { page } = await hubBrowser()
  let url = getRequestURL(event).origin
  if (!import.meta.dev) {
    url = url.replace('https://', `https://admin:${process.env.NUXT_ADMIN_PASSWORD || 'admin'}@`)
  }
  await page.goto(`${url}/_invoice`)

  setHeader(event, 'Content-Type', 'application/pdf')
  return page.pdf({ format: 'A4' })
})
