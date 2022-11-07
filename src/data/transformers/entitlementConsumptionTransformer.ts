import { EntitlementConsumption as EntitlementConsumptionClient } from '../../entitlementsAdmin/entitlementsAdminClient'
import { EntitlementConsumption as EntitlementConsumptionGraphQL } from '../../gen/graphqlTypes'
import { EntitlementConsumerTransformer } from './entitlementConsumerTransformer'

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
      consumer: graphql.consumer
        ? EntitlementConsumerTransformer.toClient(graphql.consumer)
        : undefined,
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
      consumer: client.consumer
        ? EntitlementConsumerTransformer.toGraphQL(client.consumer)
        : undefined,
    }
  }
}
