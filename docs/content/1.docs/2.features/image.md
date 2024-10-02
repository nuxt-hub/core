---
title: Image Transformation
navigation.title: Image
description: Add image transformation to your NuxtHub project.
---

## Getting Started

Enable the image transformation in your NuxtHub project by adding the `image` property to the `hub` object in your `nuxt.config.ts` file.


```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    image: {
      trustedDomains: ['hub.nuxt.com'],
      templates: {
        small: { width: 128, height: 128, format: 'webp' },
        medium: { width: 512, height: 512, format: 'webp' }
      }
    }
  }
})
```

NuxtHub will add an specific route to your project to transform the image. The route is `/_hub/image/<template>/<source-image>`. For example, to transform an image with the `small` template, you can use the following URL:

```html
<img src="https://hub.nuxt.com/_hub/image/small/example-image.jpg" />
```




## Trusted Domains

By default the image transformation is not allowed for any remote images and you can only transform images that are uploaded via `hubBlob()`. If you want to allow remote images, you can add the trusted domains to the `trustedDomains` option.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    image: {
      trustedDomains: ['hub.nuxt.com', 'example.com']
    }
  }
})
```

## Templates

In order to improve security and prevent service abuse, you need to define transformation templates for your images. You can define as many templates as you want. These templates will be used to transform the requested image.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    image: {
      templates: {
        small: { width: 128, height: 128, format: 'webp' },
        medium: { width: 512, height: 512, format: 'webp' }
      }
    }
  }
})
```

### Template Options

The template options can be defined for each template.

#### `width`

The width of the transformed image in pixels.

#### `height`

The height of the transformed image in pixels.

#### `format`

The format of the transformed image. Can be `png`, `jpeg` or `webp`.

#### `jpeg_quality`

The quality of the JPEG image. This option is only used when the `format` is `jpeg`.

#### `rotate`

The angle of rotation in degrees.
