export default eventHandler(async (event) => {
  // Available in nodejs_compat_v2
  const crypto = globalThis['process']?.getBuiltinModule?.('crypto')
  const hash = await new Promise((resolve, reject) => {
    crypto.scrypt('hello-world', crypto.randomUUID(), 64, (err, hash) => {
      if (err) return reject(err)
      resolve(hash.toString('hex'))
    })
  })

  return { hash: `scrypt:${hash}` }
})
