import { useValidatedQuery, z } from 'h3-zod'

export default eventHandler(async (event) => {
  // TODO: handle authorization

  const { name } = await useValidatedQuery(event, {
    name: z.ostring()
  })

  return useBlob(name).list()
})
