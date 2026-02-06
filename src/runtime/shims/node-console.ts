type Task = {
  end: () => void
  success: () => void
  fail: () => void
  error: () => void
}

const noopTask: Task = {
  end() {},
  success() {},
  fail() {},
  error() {}
}

const c = globalThis.console as any

function bindOrNoop(fn: any) {
  if (typeof fn !== 'function') {
    return () => {}
  }
  return fn.bind(c)
}

// Node's `node:console` default export is the console instance-like object.
// Cloudflare's Node.js compatibility layer currently exposes `createTask` that throws.
// We alias `node:console` to this module for Workers builds to avoid that crash.
export const Console = c?.Console
export const assert = bindOrNoop(c?.assert)
export const clear = bindOrNoop(c?.clear)
export const context = bindOrNoop(c?.context)
export const count = bindOrNoop(c?.count)
export const countReset = bindOrNoop(c?.countReset)
export const debug = bindOrNoop(c?.debug)
export const dir = bindOrNoop(c?.dir)
export const dirxml = bindOrNoop(c?.dirxml)
export const error = bindOrNoop(c?.error)
export const group = bindOrNoop(c?.group)
export const groupCollapsed = bindOrNoop(c?.groupCollapsed)
export const groupEnd = bindOrNoop(c?.groupEnd)
export const info = bindOrNoop(c?.info)
export const log = bindOrNoop(c?.log)
export const profile = bindOrNoop(c?.profile)
export const profileEnd = bindOrNoop(c?.profileEnd)
export const table = bindOrNoop(c?.table)
export const time = bindOrNoop(c?.time)
export const timeEnd = bindOrNoop(c?.timeEnd)
export const timeLog = bindOrNoop(c?.timeLog)
export const timeStamp = bindOrNoop(c?.timeStamp)
export const trace = bindOrNoop(c?.trace)
export const warn = bindOrNoop(c?.warn)

export function createTask(): Task {
  return noopTask
}

export default {
  Console,
  assert,
  clear,
  context,
  count,
  countReset,
  createTask,
  debug,
  dir,
  dirxml,
  error,
  group,
  groupCollapsed,
  groupEnd,
  info,
  log,
  profile,
  profileEnd,
  table,
  time,
  timeEnd,
  timeLog,
  timeStamp,
  trace,
  warn
}

