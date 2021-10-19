import { Entitlement as EntitlementClient } from '../../entitlementsAdmin/entitlementsAdminClient'
import { Entitlement as EntitlementGraphQL } from '../../gen/graphqlTypes'

export class EntitlementTransformer {
  public static toClient(graphql: EntitlementGraphQL): EntitlementClient {
    return {
      name: graphql.name,
      description: graphql.description ?? undefined,
      value: graphql.value,
    }
  }
  public static toGraphQL(client: EntitlementClient): EntitlementGraphQL {
    return {
      name: client.name,
      description: client.description,
      value: client.value,
    }
  }
}
