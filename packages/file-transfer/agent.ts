import { Dispatcher, RedirectHandler, RetryHandler } from 'undici'

class NeoRedirectHandler extends RedirectHandler {
  constructor(dispatch: Dispatcher['dispatch'], maxRedirections: number, opts: Dispatcher.RequestOptions, handler: Dispatcher.DispatchHandlers, follow: boolean) {
    super(dispatch as any, maxRedirections, opts, handler, follow)
  }

  onConnect(abort: () => void) {
    // @ts-ignore
    this.abort = abort
    // @ts-ignore
    this.handler.onConnect(abort, { history: this.history, opts: this.opts })
  }
}

export function getDefaultAgentOptions(retry?: RetryHandler.RetryOptions, defaultMaxRedirections = 5) {
  const options = {
    connections: 16,
    interceptors: {
      Agent: [
        createRedirectInterceptor(defaultMaxRedirections),
      ],
      Client: [
        createRetryInterceptor(retry),
        createRedirectInterceptor(defaultMaxRedirections),
      ],
    },
  }
  return options
}

export function createRetryInterceptor(retry?: RetryHandler.RetryOptions): Dispatcher.DispatchInterceptor {
  return (dispatch) => {
    return function Intercept(opts, handler) {
      return dispatch(opts, new RetryHandler({ ...opts, retryOptions: retry }, {
        dispatch,
        handler,
      }))
    }
  }
}

export function createRedirectInterceptor(defaultMaxRedirections: number): Dispatcher.DispatchInterceptor {
  return (dispatch) => {
    return function Intercept(opts, handler) {
      const { maxRedirections = defaultMaxRedirections } = opts as any

      if (!maxRedirections) {
        return dispatch(opts, handler)
      }

      const redirectHandler = new NeoRedirectHandler(dispatch, maxRedirections, opts, handler, false)
      opts = { ...opts, maxRedirections: 0 } as any // Stop sub dispatcher from also redirecting.
      return dispatch(opts, redirectHandler)
    }
  }
}
