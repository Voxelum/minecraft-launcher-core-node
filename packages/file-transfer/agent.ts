import { Agent, interceptors, RetryHandler } from 'undici'

export function getDefaultAgent(retry?: RetryHandler.RetryOptions, defaultMaxRedirections = 5) {
  const options: Agent.Options = {
    connections: 16,
  }
  return new Agent(options).compose(interceptors.retry(retry), interceptors.redirect({ maxRedirections: defaultMaxRedirections }))
}

