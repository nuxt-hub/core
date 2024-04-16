import type { Template } from '../types'

export const useTemplate = () => {
  const templates = useState<Template[]>('templates', () => [])

  async function fetchList() {
    if (templates.value.length) {
      return
    }

    const res = await $fetch<{ templates: Template[] }>('http://localhost:3001/api/templates')
    if (res?.templates) {
      templates.value = res.templates
    }
  }

  return {
    templates,
    fetchList,
  }
}
