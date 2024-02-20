import { z as zod } from 'zod'

export const z = {
  ...zod,
  intAsString: () => zod.string().transform(val => parseInt(val, 10))
}
