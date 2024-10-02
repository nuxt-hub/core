import { createError, eventHandler, getValidatedRouterParams, setHeader } from 'h3'
import { z } from 'zod'
import { PhotonImage, SamplingFilter, resize, rotate, initAsync } from '@cf-wasm/photon/next'
import photonWasmModule from '@cf-wasm/photon/photon.wasm?module'
import { hubBlob } from '../../../../../blob/server/utils/blob'
import { useRuntimeConfig } from '#imports'

export default eventHandler(async (event) => {
  const { image: imageOptions } = useRuntimeConfig().hub
  const trustedDomains = imageOptions?.trustedDomains || []
  const templates = imageOptions?.templates || {}
  const { params } = await getValidatedRouterParams(event, z.object({
    // match <OPTIONS>/<SOURCE-IMAGE>
    params: z.string().regex(/^\/?[^/]*\/.+$/)
  }).parse)

  await initAsync(photonWasmModule)

  const [template, ...sourceParts] = params.split('/')
  let templateOptions = templates[template]

  if (import.meta.dev && !templateOptions) {
    console.warn(`[NuxtHub] Image template "${template}" not found in config, trying to parse option from URL. This is only supported in development mode.`)
    templateOptions = parseOptions(template)
  }

  if (!templateOptions) {
    throw createError({ statusCode: 400, message: 'Invalid image transformation' })
  }

  // create a PhotonImage instance
  const inputBytes = await getImageBytes(sourceParts.join('/'), trustedDomains)
  const inputImage = PhotonImage.new_from_byteslice(inputBytes)

  let image: PhotonImage = resizeImage(inputImage, templateOptions)

  if (templateOptions.rotate) {
    const _image = image
    // rotate image using photon
    image = rotate(
      _image,
      Number(templateOptions.rotate)
    )

    _image.free()
  }

  const { format = 'webp' } = templateOptions
  let outputBytes
  switch (format) {
    case 'png':
      outputBytes = image.get_bytes()
      break
    case 'jpeg':
      outputBytes = image.get_bytes_jpeg(templateOptions.jpeg_quality || 80)
      break
    case 'webp':
    default:
      outputBytes = image.get_bytes_webp()
  }

  // call free() method to free memory
  image.free()

  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'Content-Length', outputBytes.byteLength)
  setHeader(event, 'Content-Type', `image/${format || 'webp'}`)
  return outputBytes
})

function resizeImage(image: PhotonImage, templateOptions: Record<string, string>) {
  if (templateOptions.width || templateOptions.height) {
    const imageWidth = image.get_width()
    const imageHeight = image.get_height()
    const imageRatio = imageWidth / imageHeight
    const width = templateOptions.width ? Number(templateOptions.width) : Number(templateOptions.height) * imageRatio
    const height = templateOptions.height ? Number(templateOptions.height) : Number(templateOptions.width) / imageRatio

    const _image = image
    // resize image using photon
    image = resize(
      _image,
      width,
      height,
      SamplingFilter.Lanczos3
    )

    _image.free()
  }

  return image
}

function parseOptions(options: string) {
  const templateOptions: Record<string, string> = {}
  options.split(',').forEach((option) => {
    const [key, value] = option.split('=')
    templateOptions[key] = value
  })
  return templateOptions
}

async function getImageBytes(source: string, trustedDomains: string[]) {
  if (source.startsWith('http')) {
    const hostname = new URL(source).hostname

    if (!trustedDomains.includes(hostname)) {
      if (import.meta.dev) {
        console.warn(
          `[NuxtHub] Retriving image from "${hostname}" is not allowed in production mode, consider adding "${hostname}" to trustedDomains in your config.`
        )
      } else {
        throw createError({ statusCode: 403, message: 'Image not allowed' })
      }
    }

    return await fetch(source)
      .then(res => res.arrayBuffer())
      .then(buffer => new Uint8Array(buffer))
  }

  return hubBlob().get(source)
    .then(blob => blob!.arrayBuffer())
    .then(buffer => new Uint8Array(buffer))
}
