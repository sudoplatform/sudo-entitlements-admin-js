import { ExternalUserEntitlements as ExternalUserEntitlementsClient } from '../../entitlementsAdmin/entitlementsAdminClient'
import { ExternalUserEntitlements as ExternalUserEntitlementsGraphQL } from '../../gen/graphqlTypes'
import { EntitlementTransformer } from './entitlementTransformer'

export class ExternalUserEntitlementsTransformer {
  public static toClient(
    graphql: ExternalUserEntitlementsGraphQL,
  ): ExternalUserEntitlementsClient {
    return {
      createdAt: new Date(graphql.createdAtEpochMs),
      updatedAt: new Date(graphql.updatedAtEpochMs),
      version: graphql.version,
      externalId: graphql.externalId,
      owner: graphql.owner ?? undefined,
      entitlementsSetName: graphql.entitlementsSetName ?? undefined,
      entitlementsSequenceName: graphql.entitlementsSequenceName ?? undefined,
      entitlements: graphql.entitlements.map((e) =>
        EntitlementTransformer.toClient(e),
      ),
      expendableEntitlements: graphql.expendableEntitlements.map((e) =>
        EntitlementTransformer.toClient(e),
      ),
      transitionsRelativeTo: graphql.transitionsRelativeToEpochMs
        ? new Date(graphql.transitionsRelativeToEpochMs)
        : undefined,
    }
  }

  public static toGraphQL(
    client: ExternalUserEntitlementsClient,
  ): ExternalUserEntitlementsGraphQL {
    return {
      createdAtEpochMs: client.createdAt.getTime(),
      updatedAtEpochMs: client.updatedAt.getTime(),
      version: client.version,
      externalId: client.externalId,
      owner: client.owner,
      entitlementsSetName: client.entitlementsSetName,
      entitlementsSequenceName: client.entitlementsSequenceName,
      entitlements: client.entitlements.map((e) =>
        EntitlementTransformer.toGraphQL(e),
      ),
      expendableEntitlements: client.expendableEntitlements.map((e) =>
        EntitlementTransformer.toGraphQL(e),
      ),
      transitionsRelativeToEpochMs: client.transitionsRelativeTo
        ? client.transitionsRelativeTo.getTime()
        : undefined,
    }
  }
}
