import { EntitlementsSetsConnection } from '../../entitlementsAdmin/entitlementsAdminClient'
import { EntitlementsSetsConnection as EntitlementsSetsConnectionGraphQL } from '../../gen/graphqlTypes'
import { EntitlementsSetTransformer } from './entitlementsSetTransformer'
export class EntitlementsSetsConnectionTransformer {
  public static toClient(
    graphql: EntitlementsSetsConnectionGraphQL,
  ): EntitlementsSetsConnection {
    return {
      items: graphql.items.map(EntitlementsSetTransformer.toClient),
      nextToken: graphql.nextToken ?? undefined,
    }
  }
}
