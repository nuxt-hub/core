export const formatDateByLocale = (locale, d) => {
  return new Date(d).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const asideLinks = [
  {
    icon: 'i-ph-shooting-star-duotone',
    label: 'Star on GitHub',
    to: 'https://github.com/nuxt-hub/core',
    target: '_blank'
  }, {
    icon: 'i-ph-megaphone-duotone',
    label: 'Follow on X',
    to: 'https://x.com/nuxt_hub',
    target: '_blank'
  }, {
    icon: 'i-ph-chat-centered-text-duotone',
    label: 'Chat on Discord',
    to: 'https://discord.gg/e25qqXb2mF',
    target: '_blank'
  }, {
    icon: 'i-simple-icons-nuxtdotjs',
    label: 'Nuxt Docs',
    to: 'https://nuxt.com',
    target: '_blank'
  }
]
