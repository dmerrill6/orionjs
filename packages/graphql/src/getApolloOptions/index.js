import buildSchema from '../buildSchema'
import formatError from './formatError'

export default async function (options) {
  const schema = await buildSchema(options)

  return {
    endpointURL: '/graphql',
    subscriptionsEndpoint: `/subscriptions`,
    schema,
    formatError,
    useGraphiql: options.useGraphiql || true,
    engine: options.engine,
    context: integrationContext => {
      return integrationContext.req._orionjsViewer
    }
  }
}
