import {
  AppSyncError,
  ConfigurationManager,
  DecodeError,
  DefaultConfigurationManager,
  IllegalArgumentError,
  ServiceError,
  UnknownGraphQLError,
} from '@sudoplatform/sudo-common'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync'
import { AuthOptions } from 'aws-appsync-auth-link'
import * as t from 'io-ts'
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
  ApplyEntitlementsSetToUserDocument,
  ApplyEntitlementsSetToUserInput,
  ApplyEntitlementsSetToUserMutation,
  ApplyEntitlementsToUserDocument,
  ApplyEntitlementsToUserInput,
  ApplyEntitlementsToUserMutation,
  EntitlementsSequence,
  EntitlementsSequencesConnection,
  EntitlementsSet,
  EntitlementsSetsConnection,
  ExternalEntitlementsConsumption,
  ExternalUserEntitlements,
  GetEntitlementsForUserDocument,
  GetEntitlementsForUserInput,
  GetEntitlementsForUserQuery,
  GetEntitlementsSequenceDocument,
  GetEntitlementsSequenceInput,
  GetEntitlementsSequenceQuery,
  GetEntitlementsSetDocument,
  GetEntitlementsSetInput,
  GetEntitlementsSetQuery,
  ListEntitlementsSequencesDocument,
  ListEntitlementsSequencesQuery,
  ListEntitlementsSetsDocument,
  ListEntitlementsSetsQuery,
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
  EntitlementsSequenceAlreadyExistsError,
  EntitlementsSequenceNotFoundError,
  EntitlementsSetAlreadyExistsError,
  EntitlementsSetImmutableError,
  EntitlementsSetInUse,
  EntitlementsSetNotFoundError,
  FatalError,
  InvalidEntitlementsError,
} from '../global/error'

export interface AdminApiClientProps {
  apiKey: string
  region: string
  graphqlUrl: string
}

const mutationFetchPolicy = 'no-cache'
const queryFetchPolicy = 'network-only'

export const AdminConsoleProject = t.type({
  region: t.string,
  apiUrl: t.string,
  userPoolId: t.string,
  clientId: t.string,
})

export type AdminConsoleProject = t.TypeOf<typeof AdminConsoleProject>

/**
 * For auth, we allow IAM auth primarily to enable our own
 * system tests. It's unlikely that this would be of use
 * externally so we enable IAM auth by making 'IAM' a special
 * API key value.
 */
function getAuthOptions(apiKey: string): AuthOptions {
  if (apiKey === 'IAM') {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    const sessionToken = process.env.AWS_SESSION_TOKEN

    if (accessKeyId && secretAccessKey) {
      return {
        type: AUTH_TYPE.AWS_IAM,
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken,
        },
      }
    } else {
      return {
        type: AUTH_TYPE.AWS_IAM,
        credentials: null,
      }
    }
  } else {
    return { type: AUTH_TYPE.API_KEY, apiKey }
  }
}

/**
 * AppSync wrapper to use to invoke Entitlements Service APIs.
 */
export class AdminApiClient {
  private readonly configurationManager: ConfigurationManager
  private readonly client: AWSAppSyncClient<NormalizedCacheObject>

  public constructor(
    apiKey: string,
    configurationManager?: ConfigurationManager,
    client?: AWSAppSyncClient<NormalizedCacheObject>,
  ) {
    this.configurationManager =
      configurationManager ?? DefaultConfigurationManager.getInstance()
    const config = this.configurationManager.bindConfigSet<AdminConsoleProject>(
      AdminConsoleProject,
      'adminConsoleProjectService',
    )

    this.client =
      client ??
      new AWSAppSyncClient<NormalizedCacheObject>({
        url: config.apiUrl,
        region: config.region,
        auth: getAuthOptions(apiKey),
        disableOffline: true,
      })
  }

  private graphQLErrorsToClientError(error: AppSyncError): Error {
    if (error.errorType === 'sudoplatform.ServiceError') {
      return new ServiceError(error.message)
    } else if (error.errorType === 'sudoplatform.DecodingError') {
      return new DecodeError()
    } else if (error.errorType === 'sudoplatform.InvalidArgumentError') {
      return new IllegalArgumentError()
    } else if (
      error.errorType === 'sudoplatform.entitlements.InvalidEntitlementsError'
    ) {
      return new InvalidEntitlementsError()
    } else if (
      error.errorType === 'sudoplatform.entitlements.EntitlementsSetInUse'
    ) {
      return new EntitlementsSetInUse()
    } else if (
      error.errorType ===
      'sudoplatform.entitlements.EntitlementsSetNotFoundError'
    ) {
      return new EntitlementsSetNotFoundError()
    } else if (
      error.errorType ===
      'sudoplatform.entitlements.EntitlementsSetAlreadyExistsError'
    ) {
      return new EntitlementsSetAlreadyExistsError()
    } else if (
      error.errorType ===
      'sudoplatform.entitlements.EntitlementsSequenceAlreadyExistsError'
    ) {
      return new EntitlementsSequenceAlreadyExistsError()
    } else if (
      error.errorType ===
      'sudoplatform.entitlements.EntitlementsSequenceNotFoundError'
    ) {
      return new EntitlementsSequenceNotFoundError()
    } else if (
      error.errorType ===
      'sudoplatform.entitlements.EntitlementsSetImmutableError'
    ) {
      return new EntitlementsSetImmutableError()
    } else {
      return new UnknownGraphQLError(error)
    }
  }

  public async getEntitlementsSet(
    input: GetEntitlementsSetInput,
  ): Promise<EntitlementsSet | null> {
    const result = await this.client.query<GetEntitlementsSetQuery>({
      query: GetEntitlementsSetDocument,
      variables: { input },
      fetchPolicy: queryFetchPolicy,
    })

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    return result.data.getEntitlementsSet ?? null
  }

  public async listEntitlementsSets(
    nextToken?: string,
  ): Promise<EntitlementsSetsConnection> {
    const result = await this.client.query<ListEntitlementsSetsQuery>({
      query: ListEntitlementsSetsDocument,
      variables: { nextToken: nextToken ?? null },
      fetchPolicy: queryFetchPolicy,
    })

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    return result.data.listEntitlementsSets
  }

  public async getEntitlementsForUser(
    input: GetEntitlementsForUserInput,
  ): Promise<ExternalEntitlementsConsumption> {
    const result = await this.client.query<GetEntitlementsForUserQuery>({
      query: GetEntitlementsForUserDocument,
      variables: { input },
      fetchPolicy: queryFetchPolicy,
    })

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    return result.data.getEntitlementsForUser
  }

  public async addEntitlementsSet(
    input: AddEntitlementsSetInput,
  ): Promise<EntitlementsSet> {
    const result = await this.client.mutate<AddEntitlementsSetMutation>({
      mutation: AddEntitlementsSetDocument,
      variables: { input },
      fetchPolicy: mutationFetchPolicy,
    })

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    if (result.data) {
      return result.data.addEntitlementsSet
    } else {
      throw new FatalError('addEntitlementsSet did not return any result.')
    }
  }

  public async setEntitlementsSet(
    input: SetEntitlementsSetInput,
  ): Promise<EntitlementsSet> {
    const result = await this.client.mutate<SetEntitlementsSetMutation>({
      mutation: SetEntitlementsSetDocument,
      variables: { input },
      fetchPolicy: mutationFetchPolicy,
    })

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    if (result.data) {
      return result.data.setEntitlementsSet
    } else {
      throw new FatalError('setEntitlementsSet did not return any result.')
    }
  }

  public async removeEntitlementsSet(
    input: RemoveEntitlementsSetInput,
  ): Promise<EntitlementsSet | null> {
    const result = await this.client.mutate<RemoveEntitlementsSetMutation>({
      mutation: RemoveEntitlementsSetDocument,
      variables: { input },
      fetchPolicy: mutationFetchPolicy,
    })

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    if (result.data) {
      return result.data.removeEntitlementsSet ?? null
    } else {
      throw new FatalError('removeEntitlementsSet did not return any result.')
    }
  }

  public async getEntitlementsSequence(
    input: GetEntitlementsSequenceInput,
  ): Promise<EntitlementsSequence | null> {
    const result = await this.client.query<GetEntitlementsSequenceQuery>({
      query: GetEntitlementsSequenceDocument,
      variables: { input },
      fetchPolicy: queryFetchPolicy,
    })

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    return result.data.getEntitlementsSequence ?? null
  }

  public async listEntitlementsSequences(
    nextToken?: string,
  ): Promise<EntitlementsSequencesConnection> {
    const result = await this.client.query<ListEntitlementsSequencesQuery>({
      query: ListEntitlementsSequencesDocument,
      variables: { nextToken: nextToken ?? null },
      fetchPolicy: queryFetchPolicy,
    })

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    return result.data.listEntitlementsSequences
  }

  public async addEntitlementsSequence(
    input: AddEntitlementsSequenceInput,
  ): Promise<EntitlementsSequence> {
    const result = await this.client.mutate<AddEntitlementsSequenceMutation>({
      mutation: AddEntitlementsSequenceDocument,
      variables: { input },
      fetchPolicy: mutationFetchPolicy,
    })

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    if (result.data) {
      return result.data.addEntitlementsSequence
    } else {
      throw new FatalError('addEntitlementsSequence did not return any result.')
    }
  }

  public async setEntitlementsSequence(
    input: SetEntitlementsSequenceInput,
  ): Promise<EntitlementsSequence> {
    const result = await this.client.mutate<SetEntitlementsSequenceMutation>({
      mutation: SetEntitlementsSequenceDocument,
      variables: { input },
      fetchPolicy: mutationFetchPolicy,
    })

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    if (result.data) {
      return result.data.setEntitlementsSequence
    } else {
      throw new FatalError('setEntitlementsSequence did not return any result.')
    }
  }

  public async removeEntitlementsSequence(
    input: RemoveEntitlementsSequenceInput,
  ): Promise<EntitlementsSequence | null> {
    const result = await this.client.mutate<RemoveEntitlementsSequenceMutation>(
      {
        mutation: RemoveEntitlementsSequenceDocument,
        variables: { input },
        fetchPolicy: mutationFetchPolicy,
      },
    )

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    if (result.data) {
      return result.data.removeEntitlementsSequence ?? null
    } else {
      throw new FatalError(
        'removeEntitlementsSequence did not return any result.',
      )
    }
  }

  public async applyEntitlementsSequenceToUser(
    input: ApplyEntitlementsSequenceToUserInput,
  ): Promise<ExternalUserEntitlements> {
    const result =
      await this.client.mutate<ApplyEntitlementsSequenceToUserMutation>({
        mutation: ApplyEntitlementsSequenceToUserDocument,
        variables: { input },
        fetchPolicy: mutationFetchPolicy,
      })

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    if (result.data) {
      return result.data.applyEntitlementsSequenceToUser
    } else {
      throw new FatalError('applyEntitlementsSequenceToUser unexpectedly falsy')
    }
  }

  public async applyEntitlementsSetToUser(
    input: ApplyEntitlementsSetToUserInput,
  ): Promise<ExternalUserEntitlements> {
    const result = await this.client.mutate<ApplyEntitlementsSetToUserMutation>(
      {
        mutation: ApplyEntitlementsSetToUserDocument,
        variables: { input },
        fetchPolicy: mutationFetchPolicy,
      },
    )

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    if (result.data) {
      return result.data.applyEntitlementsSetToUser
    } else {
      throw new FatalError(
        'applyEntitlementsSetToUser did not return any result.',
      )
    }
  }

  public async applyEntitlementsToUser(
    input: ApplyEntitlementsToUserInput,
  ): Promise<ExternalUserEntitlements> {
    const result = await this.client.mutate<ApplyEntitlementsToUserMutation>({
      mutation: ApplyEntitlementsToUserDocument,
      variables: { input },
      fetchPolicy: mutationFetchPolicy,
    })

    const error = result.errors?.[0]
    if (error) {
      throw this.graphQLErrorsToClientError(error)
    }

    if (result.data) {
      return result.data.applyEntitlementsToUser
    } else {
      throw new FatalError('applyEntitlementsToUser did not return any result.')
    }
  }
}
