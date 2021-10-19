import { AdminApiClient } from '../client/adminApiClient'
import { DefaultSudoEntitlementsAdminClientOptions } from '../entitlementsAdmin/entitlementsAdminClient'

export interface DefaultSudoEntitlementsAdminClientPrivateOptions
  extends DefaultSudoEntitlementsAdminClientOptions {
  adminApiClient?: AdminApiClient
}
