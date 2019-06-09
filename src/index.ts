/**
 * Next function supports optional `ctx` replacement for following middleware.
 */
export type Next<T> = () => Promise<T>;

/**
 * Middleware function pattern.
 */
export type Middleware<T, U> = (ctx: T, next: Next<U>) => U | Promise<U>;

/**
 * Final function has no `next()`.
 */
export type Done<T, U> = (ctx: T) => U | Promise<U>;

/**
 * Composed function signature.
 */
export type Composed<T, U> = (ctx: T, done: Done<T, U>) => Promise<U>;

/**
 * Debug mode wrapper for middleware functions.
 */
function debugMiddleware<T, U>(
  middleware: Array<Middleware<T, U>>
): Composed<T, U> {
  if (!Array.isArray(middleware)) {
    throw new TypeError(
      `Expected middleware to be an array, got ${typeof middleware}`
    );
  }

  for (const fn of middleware) {
    if ((typeof fn as any) !== "function") {
      // tslint:disable-line
      throw new TypeError(
        `Expected middleware to contain functions, but got ${typeof fn}`
      );
    }
  }

  return function composedDebug(ctx: T, done: Done<T, U>) {
    if ((typeof done as any) !== "function") {
      // tslint:disable-line
      throw new TypeError(
        `Expected the last argument to be \`done(ctx)\`, but got ${typeof done}`
      );
    }

    let index = 0;

    function dispatch(pos: number): Promise<U> {
      const fn = middleware[pos] || done;

      index = pos;

      return new Promise(resolve => {
        const result = fn(ctx, function next() {
          if (pos < index) {
            throw new TypeError("`next()` called multiple times");
          }

          if (pos > middleware.length) {
            throw new TypeError(
              "Composed `done(ctx)` function should not call `next()`"
            );
          }

          return dispatch(pos + 1);
        });

        if ((result as any) === undefined) {
          // tslint:disable-line
          throw new TypeError(
            "Expected middleware to return `next()` or a value"
          );
        }

        return resolve(result);
      });
    }

    return dispatch(index);
  };
}

/**
 * Production-mode middleware composition (no errors thrown).
 */
function composeMiddleware<T, U>(
  middleware: Array<Middleware<T, U>>
): Composed<T, U> {
  function dispatch(pos: number, ctx: T, done: Done<T, U>): Promise<U> {
    const fn = middleware[pos] || done;

    return new Promise<U>(resolve => {
      return resolve(
        fn(ctx, function next() {
          return dispatch(pos + 1, ctx, done);
        })
      );
    });
  }

  return function composed(ctx, done) {
    return dispatch(0, ctx, done);
  };
}

/**
 * Compose an array of middleware functions into a single function.
 */
export const compose =
  process.env.NODE_ENV === "production" ? composeMiddleware : debugMiddleware;
