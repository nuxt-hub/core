export default defineNuxtPlugin(() => {
  const cloudflareScript = document.createElement('script')
  cloudflareScript.setAttribute('src', 'https://static.cloudflareinsights.com/beacon.min.js')
  cloudflareScript.setAttribute('defer', 'true')
  cloudflareScript.setAttribute('data-cf-beacon', '{"token": "cd0e6688bd0944719fe963c41759b992"}')
  document.body.appendChild(cloudflareScript)
})
