export type NextFunction <R> = () => Promise<R>

export type Middleware5 <T1, T2, T3, T4, T5, R> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, next: NextFunction<R>) => R | Promise<R>
export type Middleware4 <T1, T2, T3, T4, R> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4, next: NextFunction<R>) => R | Promise<R>
export type Middleware3 <T1, T2, T3, R> = (arg1: T1, arg2: T2, arg3: T3, next: NextFunction<R>) => R | Promise<R>
export type Middleware2 <T1, T2, R> = (arg1: T1, arg2: T2, next: NextFunction<R>) => R | Promise<R>
export type Middleware1 <T1, R> = (arg1: T1, next: NextFunction<R>) => R | Promise<R>
export type Middleware0 <R> = (next: NextFunction<R>) => R | Promise<R>
export type Middleware <R> = (...args: any[]) => R | Promise<R>

export type OutFunction5 <T1, T2, T3, T4, T5, R> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, next: Middleware5<T1, T2, T3, T4, T5, R>) => Promise<R>
export type OutFunction4 <T1, T2, T3, T4, R> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4, next: Middleware4<T1, T2, T3, T4, R>) => Promise<R>
export type OutFunction3 <T1, T2, T3, R> = (arg1: T1, arg2: T2, arg3: T3, next: Middleware3<T1, T2, T3, R>) => Promise<R>
export type OutFunction2 <T1, T2, R> = (arg1: T1, arg2: T2, next: Middleware2<T1, T2, R>) => Promise<R>
export type OutFunction1 <T1, R> = (arg1: T1, next: Middleware1<T1, R>) => Promise<R>
export type OutFunction0 <R> = (next: Middleware0<R>) => Promise<R>
export type OutFunction <R> = (...args: any[]) => Promise<R>

/**
 * Compose an array of middleware functions into a chain.
 */
export function compose <R> (middleware: Array<Middleware0<R>>): OutFunction0<R>
export function compose <T1, R> (middleware: Array<Middleware1<T1, R>>): OutFunction1<T1, R>
export function compose <T1, T2, R> (middleware: Array<Middleware2<T1, T2, R>>): OutFunction2<T1, T2, R>
export function compose <T1, T2, T3, R> (middleware: Array<Middleware3<T1, T2, T3, R>>): OutFunction3<T1, T2, T3, R>
export function compose <T1, T2, T3, T4, R> (middleware: Array<Middleware4<T1, T2, T3, T4, R>>): OutFunction4<T1, T2, T3, T4, R>
export function compose <T1, T2, T3, T4, T5, R> (middleware: Array<Middleware5<T1, T2, T3, T4, T5, R>>): OutFunction5<T1, T2, T3, T4, T5, R>
export function compose <R> (middleware: Array<Middleware<R>>): OutFunction<R> {
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
