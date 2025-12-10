import { Agent, interceptors, RetryHandler } from 'undici'

export function getDefaultAgent(retry?: RetryHandler.RetryOptions, defaultMaxRedirections = 5) {
  const options: Agent.Options = {
    connections: 16,
  }
  return new Agent(options).compose(
    interceptors.retry(
      retry || {
        errorCodes: [
          'UND_ERR_CONNECT_TIMEOUT',
          'ECONNRESET',
          'ECONNREFUSED',
          'ENOTFOUND',
          'ENETDOWN',
          'ENETUNREACH',
          'EHOSTDOWN',
          'EHOSTUNREACH',
          'EPIPE',
          'UND_ERR_SOCKET',
        ],
      },
    ),
    interceptors.redirect({ maxRedirections: defaultMaxRedirections }),
  )
}
