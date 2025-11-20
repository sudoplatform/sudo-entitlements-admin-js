import {
  AppSyncError,
  ConfigurationManager,
  DefaultConfigurationManager,
  GraphQLNetworkError,
  mapGraphQLToClientError,
  mapNetworkErrorToClientError,
  UnknownGraphQLError,
} from '@sudoplatform/sudo-common'
import { GraphQLError } from 'graphql'
import * as t from 'io-ts'
import { ErrorCodeTransformer } from '../data/transformers/errorCodeTransformer'
import {
  AddEntitlementsSequenceDocument,
  AddEntitlementsSequenceInput,
  AddEntitlementsSequenceMutation,
  AddEntitlementsSetDocument,
  AddEntitlementsSetInput,
  AddEntitlementsSetMutation,
  ApplyEntitlementsSequenceToUserDocument,
  ApplyEntitlementsSequenceToUserInput,
  ApplyEntitlementsSequenceToUserMutation,
  ApplyEntitlementsSequenceToUsersDocument,
  ApplyEntitlementsSequenceToUsersInput,
  ApplyEntitlementsSequenceToUsersMutation,
  ApplyEntitlementsSetToUserDocument,
  ApplyEntitlementsSetToUserInput,
  ApplyEntitlementsSetToUserMutation,
  ApplyEntitlementsSetToUsersDocument,
  ApplyEntitlementsSetToUsersInput,
  ApplyEntitlementsSetToUsersMutation,
  ApplyEntitlementsToUserDocument,
  ApplyEntitlementsToUserInput,
  ApplyEntitlementsToUserMutation,
  ApplyEntitlementsToUsersDocument,
  ApplyEntitlementsToUsersInput,
  ApplyEntitlementsToUsersMutation,
  ApplyExpendableEntitlementsToUserDocument,
  ApplyExpendableEntitlementsToUserInput,
  ApplyExpendableEntitlementsToUserMutation,
  EntitledUser,
  EntitlementDefinition,
  EntitlementDefinitionConnection,
  EntitlementsSequence,
  EntitlementsSequencesConnection,
  EntitlementsSet,
  EntitlementsSetsConnection,
  ExternalEntitlementsConsumption,
  ExternalUserEntitlements,
  ExternalUserEntitlementsResult,
  GetEntitlementDefinitionDocument,
  GetEntitlementDefinitionInput,
  GetEntitlementDefinitionQuery,
  GetEntitlementsForUserDocument,
  GetEntitlementsForUserInput,
  GetEntitlementsForUserQuery,
  GetEntitlementsSequenceDocument,
  GetEntitlementsSequenceInput,
  GetEntitlementsSequenceQuery,
  GetEntitlementsSetDocument,
  GetEntitlementsSetInput,
  GetEntitlementsSetQuery,
  ListEntitlementDefinitionsDocument,
  ListEntitlementDefinitionsQuery,
  ListEntitlementsSequencesDocument,
  ListEntitlementsSequencesQuery,
  ListEntitlementsSetsDocument,
  ListEntitlementsSetsQuery,
  RemoveEntitledUserDocument,
  RemoveEntitledUserInput,
  RemoveEntitledUserMutation,
  RemoveEntitlementsSequenceDocument,
  RemoveEntitlementsSequenceInput,
  RemoveEntitlementsSequenceMutation,
  RemoveEntitlementsSetDocument,
  RemoveEntitlementsSetInput,
  RemoveEntitlementsSetMutation,
  SetEntitlementsSequenceDocument,
  SetEntitlementsSequenceInput,
  SetEntitlementsSequenceMutation,
  SetEntitlementsSetDocument,
  SetEntitlementsSetInput,
  SetEntitlementsSetMutation,
} from '../gen/graphqlTypes'
import {
  AlreadyUpdatedError,
  BulkOperationDuplicateUsersError,
  DuplicateEntitlementError,
  EntitlementsSequenceAlreadyExistsError,
  EntitlementsSequenceNotFoundError,
  EntitlementsSequenceUpdateInProgressError,
  EntitlementsSetAlreadyExistsError,
  EntitlementsSetImmutableError,
  EntitlementsSetInUseError,
  EntitlementsSetNotFoundError,
  FatalError,
  InvalidEntitlementsError,
  NegativeEntitlementError,
  OverflowedEntitlementError,
} from '../global/error'
import {
  GraphQLClient,
  GraphQLClientAuthMode,
  internal,
} from '@sudoplatform/sudo-user'

export interface AWSCredential {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}

export type Credential =
  | { type: 'API_KEY'; key: string }
  | {
      type: 'IAM'
      credential?: AWSCredential
    }

// eslint-disable-next-line tree-shaking/no-side-effects-in-initialization
export const AdminConsoleProject = t.type({
  region: t.string,
  apiUrl: t.string,
  userPoolId: t.string,
  clientId: t.string,
})

export type AdminConsoleProject = t.TypeOf<typeof AdminConsoleProject>

/**
 * For auth, we allow IAM auth primarily to enable our own
 * system tests.
 */
function fillCredentials(credential: Credential): Credential {
  if (credential.type === 'IAM' && !credential.credential) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    const sessionToken = process.env.AWS_SESSION_TOKEN

    if (accessKeyId && secretAccessKey) {
      credential.credential = {
        accessKeyId,
        secretAccessKey,
        sessionToken,
      }
    }
  }
  return credential
}

/**
 * AppSync wrapper to use to invoke Entitlements Service APIs.
 */
export class AdminApiClient {
  private readonly configurationManager: ConfigurationManager
  private readonly client: GraphQLClient

  public constructor(
    apiKeyOrCred: string | Credential,
    configurationManager?: ConfigurationManager,
    client?: GraphQLClient,
  ) {
    this.configurationManager =
      configurationManager ?? DefaultConfigurationManager.getInstance()
    const config = this.configurationManager.bindConfigSet<AdminConsoleProject>(
      AdminConsoleProject,
      'adminConsoleProjectService',
    )
    const credential: Credential = fillCredentials(
      typeof apiKeyOrCred === 'string'
        ? apiKeyOrCred === 'IAM'
          ? { type: 'IAM' }
          : { type: 'API_KEY', key: apiKeyOrCred }
        : apiKeyOrCred,
    )

    this.client =
      client ??
      new internal.AmplifyClient({
        graphqlUrl: config.apiUrl,
        region: config.region,
        authMode:
          credential.type === 'IAM'
            ? GraphQLClientAuthMode.IAM
            : GraphQLClientAuthMode.ApiKey,
        apiKey: credential.type === 'API_KEY' ? credential.key : undefined,
        credentials:
          credential.type === 'IAM' ? credential.credential : undefined,
      })
  }

  public graphQLErrorToClientError(error: AppSyncError | GraphQLError): Error {
    const errorType = 'errorType' in error ? error.errorType : error.message

    if (errorType?.startsWith('sudoplatform.entitlements.')) {
      const code = errorType.replace('sudoplatform.entitlements.', '')
      switch (code) {
        case 'AlreadyUpdatedError': {
          return new AlreadyUpdatedError()
        }
        case 'BulkOperationDuplicateUsersError': {
          return new BulkOperationDuplicateUsersError()
        }
        case 'DuplicateEntitlementError': {
          return new DuplicateEntitlementError()
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
        case 'NegativeEntitlementError': {
          return new NegativeEntitlementError()
        }
        case 'OverflowedEntitlementError': {
          return new OverflowedEntitlementError()
        }
      }
    }

    return mapGraphQLToClientError(error)
  }

  private mapAndThrowError(
    returnedError?: AppSyncError,
    thrownError?: Error,
  ): never {
    if (thrownError) {
      const networkError = thrownError as GraphQLNetworkError
      if (networkError.originalError) {
        throw mapNetworkErrorToClientError(networkError)
      }
      if (
        'graphQLErrors' in thrownError &&
        Array.isArray(thrownError.graphQLErrors) &&
        thrownError.graphQLErrors.length > 0
      ) {
        returnedError = thrownError.graphQLErrors?.[0] as AppSyncError
      } else if ((thrownError as AppSyncError).errorType) {
        returnedError = thrownError as AppSyncError
      } else {
        throw new UnknownGraphQLError(thrownError)
      }
    }
    if (returnedError) {
      throw ErrorCodeTransformer.toError(returnedError?.errorType ?? undefined)
    } else {
      throw new FatalError('no error to map')
    }
  }

  public async getEntitlementsSet(
    input: GetEntitlementsSetInput,
  ): Promise<EntitlementsSet | null> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.query<GetEntitlementsSetQuery>({
        query: GetEntitlementsSetDocument,
        variables: { input },
      })
      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        return result.data.getEntitlementsSet ?? null
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async listEntitlementsSets(
    nextToken?: string,
  ): Promise<EntitlementsSetsConnection> {
    let graphqlError: GraphQLError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.query<ListEntitlementsSetsQuery>({
        query: ListEntitlementsSetsDocument,
        variables: { nextToken: nextToken ?? null },
      })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        return result.data.listEntitlementsSets
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async getEntitlementDefinition(
    input: GetEntitlementDefinitionInput,
  ): Promise<EntitlementDefinition | null> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.query<GetEntitlementDefinitionQuery>({
        query: GetEntitlementDefinitionDocument,
        variables: { input },
      })
      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        return result.data.getEntitlementDefinition ?? null
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async listEntitlementDefinitions(
    limit?: number,
    nextToken?: string,
  ): Promise<EntitlementDefinitionConnection> {
    let graphqlError: GraphQLError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.query<ListEntitlementDefinitionsQuery>({
        query: ListEntitlementDefinitionsDocument,
        variables: { limit: limit, nextToken: nextToken ?? null },
      })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        return result.data.listEntitlementDefinitions
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async getEntitlementsForUser(
    input: GetEntitlementsForUserInput,
  ): Promise<ExternalEntitlementsConsumption> {
    let graphqlError: GraphQLError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.query<GetEntitlementsForUserQuery>({
        query: GetEntitlementsForUserDocument,
        variables: { input },
      })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        return result.data.getEntitlementsForUser
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async addEntitlementsSet(
    input: AddEntitlementsSetInput,
  ): Promise<EntitlementsSet> {
    let graphqlError: GraphQLError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.mutate<AddEntitlementsSetMutation>({
        mutation: AddEntitlementsSetDocument,
        variables: { input },
      })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.addEntitlementsSet
        } else {
          throw new FatalError('addEntitlementsSet did not return any result.')
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async setEntitlementsSet(
    input: SetEntitlementsSetInput,
  ): Promise<EntitlementsSet> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.mutate<SetEntitlementsSetMutation>({
        mutation: SetEntitlementsSetDocument,
        variables: { input },
      })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.setEntitlementsSet
        } else {
          throw new FatalError('setEntitlementsSet did not return any result.')
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async removeEntitlementsSet(
    input: RemoveEntitlementsSetInput,
  ): Promise<EntitlementsSet | null> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.mutate<RemoveEntitlementsSetMutation>({
        mutation: RemoveEntitlementsSetDocument,
        variables: { input },
      })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.removeEntitlementsSet ?? null
        } else {
          throw new FatalError(
            'removeEntitlementsSet did not return any result.',
          )
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async getEntitlementsSequence(
    input: GetEntitlementsSequenceInput,
  ): Promise<EntitlementsSequence | null> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.query<GetEntitlementsSequenceQuery>({
        query: GetEntitlementsSequenceDocument,
        variables: { input },
      })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        return result.data.getEntitlementsSequence ?? null
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async listEntitlementsSequences(
    nextToken?: string,
  ): Promise<EntitlementsSequencesConnection> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.query<ListEntitlementsSequencesQuery>({
        query: ListEntitlementsSequencesDocument,
        variables: { nextToken: nextToken ?? null },
      })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        return result.data.listEntitlementsSequences
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async addEntitlementsSequence(
    input: AddEntitlementsSequenceInput,
  ): Promise<EntitlementsSequence> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.mutate<AddEntitlementsSequenceMutation>({
        mutation: AddEntitlementsSequenceDocument,
        variables: { input },
      })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.addEntitlementsSequence
        } else {
          throw new FatalError(
            'addEntitlementsSequence did not return any result.',
          )
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async setEntitlementsSequence(
    input: SetEntitlementsSequenceInput,
  ): Promise<EntitlementsSequence> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.mutate<SetEntitlementsSequenceMutation>({
        mutation: SetEntitlementsSequenceDocument,
        variables: { input },
      })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.setEntitlementsSequence
        } else {
          throw new FatalError(
            'setEntitlementsSequence did not return any result.',
          )
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async removeEntitlementsSequence(
    input: RemoveEntitlementsSequenceInput,
  ): Promise<EntitlementsSequence | null> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result =
        await this.client.mutate<RemoveEntitlementsSequenceMutation>({
          mutation: RemoveEntitlementsSequenceDocument,
          variables: { input },
        })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.removeEntitlementsSequence ?? null
        } else {
          throw new FatalError(
            'removeEntitlementsSequence did not return any result.',
          )
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async applyEntitlementsSequenceToUser(
    input: ApplyEntitlementsSequenceToUserInput,
  ): Promise<ExternalUserEntitlements> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result =
        await this.client.mutate<ApplyEntitlementsSequenceToUserMutation>({
          mutation: ApplyEntitlementsSequenceToUserDocument,
          variables: { input },
        })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.applyEntitlementsSequenceToUser
        } else {
          throw new FatalError(
            'applyEntitlementsSequenceToUser unexpectedly falsy',
          )
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async applyEntitlementsSequenceToUsers(
    input: ApplyEntitlementsSequenceToUsersInput,
  ): Promise<ExternalUserEntitlementsResult[]> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result =
        await this.client.mutate<ApplyEntitlementsSequenceToUsersMutation>({
          mutation: ApplyEntitlementsSequenceToUsersDocument,
          variables: { input },
        })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.applyEntitlementsSequenceToUsers
        } else {
          throw new FatalError(
            'applyEntitlementsSequenceToUsers unexpectedly falsy',
          )
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async applyEntitlementsSetToUser(
    input: ApplyEntitlementsSetToUserInput,
  ): Promise<ExternalUserEntitlements> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result =
        await this.client.mutate<ApplyEntitlementsSetToUserMutation>({
          mutation: ApplyEntitlementsSetToUserDocument,
          variables: { input },
        })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.applyEntitlementsSetToUser
        } else {
          throw new FatalError(
            'applyEntitlementsSetToUser did not return any result.',
          )
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async applyEntitlementsSetToUsers(
    input: ApplyEntitlementsSetToUsersInput,
  ): Promise<ExternalUserEntitlementsResult[]> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result =
        await this.client.mutate<ApplyEntitlementsSetToUsersMutation>({
          mutation: ApplyEntitlementsSetToUsersDocument,
          variables: { input },
        })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.applyEntitlementsSetToUsers
        } else {
          throw new FatalError(
            'applyEntitlementsSetToUsers did not return any result.',
          )
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async applyEntitlementsToUser(
    input: ApplyEntitlementsToUserInput,
  ): Promise<ExternalUserEntitlements> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.mutate<ApplyEntitlementsToUserMutation>({
        mutation: ApplyEntitlementsToUserDocument,
        variables: { input },
      })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.applyEntitlementsToUser
        } else {
          throw new FatalError(
            'applyEntitlementsToUser did not return any result.',
          )
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async applyEntitlementsToUsers(
    input: ApplyEntitlementsToUsersInput,
  ): Promise<ExternalUserEntitlementsResult[]> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.mutate<ApplyEntitlementsToUsersMutation>(
        {
          mutation: ApplyEntitlementsToUsersDocument,
          variables: { input },
        },
      )

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.applyEntitlementsToUsers
        } else {
          throw new FatalError(
            'applyEntitlementsToUsers did not return any result.',
          )
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async applyExpendableEntitlementsToUser(
    input: ApplyExpendableEntitlementsToUserInput,
  ): Promise<ExternalUserEntitlements> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result =
        await this.client.mutate<ApplyExpendableEntitlementsToUserMutation>({
          mutation: ApplyExpendableEntitlementsToUserDocument,
          variables: { input },
        })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.applyExpendableEntitlementsToUser
        } else {
          throw new FatalError(
            'applyExpendableEntitlementsToUser did not return any result.',
          )
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }

  public async removeEntitledUser(
    input: RemoveEntitledUserInput,
  ): Promise<EntitledUser | null> {
    let graphqlError: AppSyncError | undefined
    let thrownError: Error | undefined
    try {
      const result = await this.client.mutate<RemoveEntitledUserMutation>({
        mutation: RemoveEntitledUserDocument,
        variables: { input },
      })

      graphqlError = result.errors?.[0]
      if (!graphqlError) {
        if (result.data) {
          return result.data.removeEntitledUser ?? null
        } else {
          throw new FatalError('removeEntitledUser did not return any result.')
        }
      }
    } catch (err) {
      thrownError = err as Error
    }

    this.mapAndThrowError(graphqlError, thrownError)
  }
}
