/**
 * Next function supports optional `ctx` replacement for following middleware.
 */
export type Next <T, U> = (ctx?: T) => Promise<U>

/**
 * Middleware function pattern.
 */
export type Middleware <T, U> = (ctx: T, next: Next<T, U>) => U | Promise<U>

/**
 * Final function has no `next()`.
 */
export type Done <T, U> = (ctx: T) => U | Promise<U>

/**
 * Composed function signature.
 */
export type Composed <T, U> = (ctx: T, done: Done<T, U>) => Promise<U>

/**
 * Default to "debug" mode when in development.
 */
const debugMode = process.env.NODE_ENV !== 'production'

/**
 * Debug mode wrapper for middleware functions.
 */
function debugMiddleware <T, U> (middleware: Array<Middleware<T, U>>): Composed<T, U> {
  if (!Array.isArray(middleware)) {
    throw new TypeError(`Expected middleware to be an array, got ${typeof middleware}`)
  }

  for (const fn of middleware) {
    if (typeof fn !== 'function') { // tslint:disable-line
      throw new TypeError(`Expected middleware to contain functions, but got ${typeof fn}`)
    }
  }

  return function debugComposed (ctx: T, done: Done<T, U>) {
    if (typeof done !== 'function') { // tslint:disable-line
      throw new TypeError(`Expected the last argument to be \`done(ctx)\`, but got ${typeof done}`)
    }

    function dispatcher (startIndex: number, ctx: T) {
      let index = startIndex

      function dispatch (pos: number): Promise<U> {
        const fn = middleware[pos] || done

        if (pos > middleware.length) {
          throw new TypeError('Composed `done(ctx)` function should not call `next()`')
        }

        index = pos

        return new Promise(resolve => {
          const result = fn(ctx, function next (newCtx?: T) {
            if (index > pos) throw new TypeError('`next()` called multiple times')

            if (newCtx === undefined) return dispatch(pos + 1)

            return dispatcher(pos + 1, newCtx)
          })

          if (result === undefined) { // tslint:disable-line
            throw new TypeError('Expected middleware to return `next()` or a value')
          }

          return resolve(result)
        })
      }

      return dispatch(startIndex)
    }

    return dispatcher(0, ctx)
  }
}

/**
 * Production-mode middleware composition (no errors thrown).
 */
function composeMiddleware <T, U> (middleware: Array<Middleware<T, U>>): Composed<T, U> {
  function dispatch (pos: number, ctx: T, done: Done<T, U>): Promise<U> {
    const fn = middleware[pos]

    if (!fn) return new Promise<U>(resolve => resolve(done(ctx)))

    return new Promise<U>(resolve => {
      return resolve(fn(ctx, function next (newCtx?: T) {
        return dispatch(pos + 1, newCtx === undefined ? ctx : newCtx, done)
      }))
    })
  }

  return function composed (ctx, done) {
    return dispatch(0, ctx, done)
  }
}

/**
 * Compose an array of middleware functions into a single function.
 */
export function compose <T, U> (middleware: Array<Middleware<T, U>>, debug = debugMode): Composed<T, U> {
  return debug ? debugMiddleware(middleware) : composeMiddleware(middleware)
}
