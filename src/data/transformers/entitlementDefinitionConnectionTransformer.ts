import { EntitlementDefinitionConnection } from '../../entitlementsAdmin/entitlementsAdminClient'
import { EntitlementDefinitionConnection as EntitlementDefinitionConnectionGraphQL } from '../../gen/graphqlTypes'
import { EntitlementDefinitionTransformer } from './entitlementDefinitionTransformer'
export class EntitlementDefinitionConnectionTransformer {
  public static toClient(
    graphql: EntitlementDefinitionConnectionGraphQL,
  ): EntitlementDefinitionConnection {
    return {
      items: graphql.items.map(EntitlementDefinitionTransformer.toClient),
      nextToken: graphql.nextToken ?? undefined,
    }
  }
}
