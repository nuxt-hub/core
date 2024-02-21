import { z as zod } from 'zod'

interface ExtendedZodMethods {
  intAsString: () => zod.ZodEffects<zod.ZodString, number, string>
}
type ExtendedZod = typeof zod & ExtendedZodMethods

export const z: ExtendedZod = {
  ...zod,
  intAsString: () => zod.string().transform(val => parseInt(val, 10))
}
