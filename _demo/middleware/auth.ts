export default defineNuxtRouteMiddleware(() => {
  const { user } = useHub().auth

  if (!user.value) {
    return navigateTo('/')
  }
})
