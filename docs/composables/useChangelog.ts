import type { Changelog } from '~/types'

export const useChangelog = () => {
  const changelogs = useState<Changelog[]>('changelogs', () => [])

  async function fetchList() {
    if (changelogs.value.length) {
      return
    }

    try {
      const data = await queryContent<Changelog>('/changelog')
        .where({ _extension: 'md' })
        .without(['body', 'excerpt'])
        .sort({ date: -1 })
        .find()

        changelogs.value = (data as Changelog[]).filter(changelog => changelog._path !== '/changelog')
    }
    catch (e) {
      changelogs.value = []
      return e
    }
  }

  return {
    changelogs,
    fetchList
  }
}
