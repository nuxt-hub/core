export default eventHandler(async (event) => {
  const { isEUCountry, continent, city, timezone, country, region, latitude, longitude, botManagement } = event.context.cf
  const ip = getRequestIP(event, { xForwardedFor: true }) || getHeader(event, 'cf-Connecting-ip')
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
