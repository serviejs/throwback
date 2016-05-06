import Promise = require('any-promise')

export interface NextFunction <T> {
  (): Promise<T>
}

/**
 * Compose an array of middleware functions into a chain.
 */
export function compose <T> (middleware: Array<(...args: any[]) => T | Promise<T>>): (...args: any[]) => Promise<T> {
  if (!Array.isArray(middleware)) {
    throw new TypeError(`Expected middleware to be an array, got ${typeof middleware}`)
  }

  for (const fn of middleware) {
    if (typeof fn !== 'function') {
      throw new TypeError(`Expected middleware to contain functions, got ${typeof fn}`)
    }
  }

  return function (...args: any[]) {
    let index = -1
    const done = args.pop()

    if (typeof done !== 'function') {
      throw new TypeError(`Expected the last argument to be \`next()\`, got ${typeof done}`)
    }

    function dispatch (pos: number): Promise<any> {
      if (pos <= index) {
        throw new TypeError('`next()` called multiple times')
      }

      index = pos

      const fn = middleware[pos] || done

      return new Promise(resolve => {
        return resolve(fn(...args, function next () {
          return dispatch(pos + 1)
        }))
      })
    }

    return dispatch(0)
  }
}
