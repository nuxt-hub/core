import { useValidatedParams, useValidatedQuery, z } from 'h3-zod'

export default eventHandler(async (event) => {
  // TODO: handle authorization

  const { name } = await useValidatedQuery(event, {
    name: z.ostring()
  })
  const { key } = await useValidatedParams(event, {
    key: z.string().min(1)
  })

  return useBlob(name).get(key)
})
