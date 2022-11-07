import { EntitlementConsumer as EntitlementConsumerClient } from '../../entitlementsAdmin/entitlementsAdminClient'
import { EntitlementConsumer as EntitlementConsumerGraphQL } from '../../gen/graphqlTypes'

export class EntitlementConsumerTransformer {
  public static toClient(
    graphql: EntitlementConsumerGraphQL,
  ): EntitlementConsumerClient {
    return {
      id: graphql.id,
      issuer: graphql.issuer,
    }
  }

  public static toGraphQL(
    client: EntitlementConsumerClient,
  ): EntitlementConsumerGraphQL {
    return {
      id: client.id,
      issuer: client.issuer,
    }
  }
}
