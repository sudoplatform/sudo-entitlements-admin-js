import { ExternalUserEntitlementsResult as ExternalUserEntitlementsResultClient } from '../../entitlementsAdmin/entitlementsAdminClient'
import {
  ExternalUserEntitlementsError as ExternalUserEntitlementsErrorGraphQL,
  ExternalUserEntitlementsResult as ExternalUserEntitlementsResultGraphQL,
} from '../../gen/graphqlTypes'
import { ErrorCodeTransformer } from './errorCodeTransformer'
import { ExternalUserEntitlementsTransformer } from './externalUserEntitlementsTransformer'

function isExternalUserEntitlementsErrorGraphQL(
  u: ExternalUserEntitlementsResultGraphQL,
): u is ExternalUserEntitlementsErrorGraphQL {
  return (
    u.__typename === 'ExternalUserEntitlementsError' ||
    (u.__typename === undefined && 'error' in u)
  )
}

export class ExternalUserEntitlementsResultTransformer {
  public static toClient(
    graphql: ExternalUserEntitlementsResultGraphQL,
  ): ExternalUserEntitlementsResultClient {
    return isExternalUserEntitlementsErrorGraphQL(graphql)
      ? {
          error: ErrorCodeTransformer.toError(graphql.error),
        }
      : ExternalUserEntitlementsTransformer.toClient(graphql)
  }
}
