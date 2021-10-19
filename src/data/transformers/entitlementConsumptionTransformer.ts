import { EntitlementConsumption as EntitlementConsumptionClient } from '../../entitlementsAdmin/entitlementsAdminClient'
import { EntitlementConsumption as EntitlementConsumptionGraphQL } from '../../gen/graphqlTypes'

export class EntitlementConsumptionTransformer {
  public static toClient(
    graphql: EntitlementConsumptionGraphQL,
  ): EntitlementConsumptionClient {
    return {
      name: graphql.name,
      value: graphql.value,
      available: graphql.available,
      consumed: graphql.consumed,
      firstConsumedAtEpochMs: graphql.firstConsumedAtEpochMs ?? undefined,
      lastConsumedAtEpochMs: graphql.lastConsumedAtEpochMs ?? undefined,
    }
  }
  public static toGraphQL(
    client: EntitlementConsumptionClient,
  ): EntitlementConsumptionGraphQL {
    return {
      name: client.name,
      value: client.value,
      available: client.available,
      consumed: client.consumed,
      firstConsumedAtEpochMs: client.firstConsumedAtEpochMs,
      lastConsumedAtEpochMs: client.lastConsumedAtEpochMs,
    }
  }
}
