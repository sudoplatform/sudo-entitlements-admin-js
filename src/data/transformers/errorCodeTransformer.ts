import { mapGraphQLToClientError } from '@sudoplatform/sudo-common'
import {
  AlreadyUpdatedError,
  BulkOperationDuplicateUsersError,
  EntitlementsSequenceAlreadyExistsError,
  EntitlementsSequenceNotFoundError,
  EntitlementsSequenceUpdateInProgressError,
  EntitlementsSetAlreadyExistsError,
  EntitlementsSetImmutableError,
  EntitlementsSetInUseError,
  EntitlementsSetNotFoundError,
  InvalidEntitlementsError,
} from '../../global/error'

export class ErrorCodeTransformer {
  public static toError(code: string | undefined): Error {
    if (code?.startsWith('sudoplatform.entitlements.')) {
      code = code.replace(/^sudoplatform.entitlements./, '')
      switch (code) {
        case 'AlreadyUpdatedError': {
          return new AlreadyUpdatedError()
        }
        case 'BulkOperationDuplicateUsersError': {
          return new BulkOperationDuplicateUsersError()
        }
        case 'EntitlementsSequenceAlreadyExistsError': {
          return new EntitlementsSequenceAlreadyExistsError()
        }
        case 'EntitlementsSequenceNotFoundError': {
          return new EntitlementsSequenceNotFoundError()
        }
        case 'EntitlementsSequenceUpdateInProgressError': {
          return new EntitlementsSequenceUpdateInProgressError()
        }
        case 'EntitlementsSetAlreadyExistsError': {
          return new EntitlementsSetAlreadyExistsError()
        }
        case 'EntitlementsSetImmutableError': {
          return new EntitlementsSetImmutableError()
        }
        case 'EntitlementsSetInUseError': {
          return new EntitlementsSetInUseError()
        }
        case 'EntitlementsSetNotFoundError': {
          return new EntitlementsSetNotFoundError()
        }
        case 'InvalidEntitlementsError': {
          return new InvalidEntitlementsError()
        }
      }
    }

    return mapGraphQLToClientError({ errorType: code, message: code ?? '' })
  }
}
