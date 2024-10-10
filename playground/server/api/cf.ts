export default eventHandler(async (event) => {
  const { isEUCountry, continent, city, timezone, country, region, latitude, longitude, botManagement } = event.context.cf
  const ip = getHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true })
  return {
    continent,
    isEUCountry,
    country,
    region,
    city,
    timezone,
    latitude,
    longitude,
    botManagement,
    ip
  }
})
