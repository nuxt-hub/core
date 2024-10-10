export default eventHandler(async (event) => {
  const { isEUCountry, continent, city, timezone, country, region, latitude, longitude, botManagement } = event.context.cf
  return {
    continent,
    isEUCountry,
    country,
    region,
    city,
    timezone,
    latitude,
    longitude,
    botManagement
  }
})
