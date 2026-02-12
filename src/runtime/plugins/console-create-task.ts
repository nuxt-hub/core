export default async () => {
  const globalConsole = console as any
  const noopTask = {
    end() {},
    success() {},
    fail() {},
    error() {}
  }

  function overrideCreateTask(target: any) {
    if (!target) return
    try {
      Object.defineProperty(target, 'createTask', {
        value: () => noopTask,
        configurable: true,
        writable: true
      })
      return
    } catch {
      void 0
    }
    try {
      target.createTask = () => noopTask
    } catch {
      void 0
    }
  }

  function overrideConsolePrototype(target: any) {
    const ConsoleCtor = target?.Console
    if (!ConsoleCtor?.prototype) return
    overrideCreateTask(ConsoleCtor.prototype)
  }

  function patchConsole(target: any) {
    // Some runtimes expose createTask but throw ERR_METHOD_NOT_IMPLEMENTED.
    if (typeof target?.createTask !== 'function') {
      overrideCreateTask(target)
    } else {
      try {
        const t = target.createTask('nuxthub:init')
        if (t && typeof t.end === 'function') t.end()
      } catch {
        overrideCreateTask(target)
      }
    }

    // Some call sites go through Console.prototype.createTask.
    overrideConsolePrototype(target)
  }

  patchConsole(globalConsole)

  // Also patch the `node:console` polyfill used in workerd/unenv bundles.
  try {
    const nodeConsole = await import('node:console') as any
    patchConsole(nodeConsole?.default || nodeConsole)
  } catch {
    // ignore
  }
}
