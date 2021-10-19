import { ExternalEntitlementsConsumption as ExternalEntitlementsConsumptionClient } from '../../entitlementsAdmin/entitlementsAdminClient'
import { ExternalEntitlementsConsumption as ExternalEntitlementsConsumptionGraphQL } from '../../gen/graphqlTypes'
import { EntitlementConsumptionTransformer } from './entitlementConsumptionTransformer'
import { ExternalUserEntitlementsTransformer } from './externalUserEntitlementsTransformer'

export class ExternalEntitlementsConsumptionTransformer {
  public static toClient(
    graphql: ExternalEntitlementsConsumptionGraphQL,
  ): ExternalEntitlementsConsumptionClient {
    return {
      entitlements: ExternalUserEntitlementsTransformer.toClient(
        graphql.entitlements,
      ),
      consumption: graphql.consumption.map(
        EntitlementConsumptionTransformer.toClient,
      ),
    }
  }

  public static toGraphQL(
    client: ExternalEntitlementsConsumptionClient,
  ): ExternalEntitlementsConsumptionGraphQL {
    return {
      entitlements: ExternalUserEntitlementsTransformer.toGraphQL(
        client.entitlements,
      ),
      consumption: client.consumption.map(
        EntitlementConsumptionTransformer.toGraphQL,
      ),
    }
  }
}
