import { EntitlementsSet } from '../../entitlementsAdmin/entitlementsAdminClient'
import { EntitlementsSet as EntitlementsSetGraphQL } from '../../gen/graphqlTypes'
import { EntitlementTransformer } from './entitlementTransformer'

export class EntitlementsSetTransformer {
  public static toClient(graphql: EntitlementsSetGraphQL): EntitlementsSet {
    return {
      createdAt: new Date(graphql.createdAtEpochMs),
      updatedAt: new Date(graphql.updatedAtEpochMs),
      version: graphql.version,
      name: graphql.name,
      description: graphql.description ?? undefined,
      entitlements: graphql.entitlements.map(EntitlementTransformer.toClient),
    }
  }

  public static toGraphQL(client: EntitlementsSet): EntitlementsSetGraphQL {
    return {
      createdAtEpochMs: client.createdAt.getTime(),
      updatedAtEpochMs: client.updatedAt.getTime(),
      version: client.version,
      name: client.name,
      description: client.description,
      entitlements: client.entitlements.map(EntitlementTransformer.toGraphQL),
    }
  }
}
