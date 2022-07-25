/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AppSyncError,
  ConfigurationManager,
  LimitExceededError,
  NoEntitlementsError,
  UnknownGraphQLError,
} from '@sudoplatform/sudo-common'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { NetworkStatus } from 'apollo-client'
import { AWSAppSyncClient } from 'aws-appsync'
import { GraphQLError } from 'graphql'
import {
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito'
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
} from '..'
import {
  AddEntitlementsSetDocument,
  AddEntitlementsSetMutation,
  ApplyEntitlementsSetToUserDocument,
  ApplyEntitlementsSetToUserMutation,
  ApplyEntitlementsToUserDocument,
  ApplyEntitlementsToUserMutation,
  EntitlementsSet,
  EntitlementsSequence,
  ExternalEntitlementsConsumption,
  ExternalUserEntitlements,
  GetEntitlementsForUserDocument,
  GetEntitlementsForUserQuery,
  GetEntitlementsSetDocument,
  GetEntitlementsSetQuery,
  ListEntitlementsSetsDocument,
  ListEntitlementsSetsQuery,
  RemoveEntitlementsSetDocument,
  RemoveEntitlementsSetMutation,
  SetEntitlementsSetDocument,
  SetEntitlementsSetMutation,
  EntitlementsSequenceTransition,
  GetEntitlementsSequenceQuery,
  GetEntitlementsSequenceDocument,
  ListEntitlementsSequencesQuery,
  ListEntitlementsSequencesDocument,
  AddEntitlementsSequenceMutation,
  AddEntitlementsSequenceDocument,
  SetEntitlementsSequenceMutation,
  SetEntitlementsSequenceDocument,
  RemoveEntitlementsSequenceMutation,
  RemoveEntitlementsSequenceDocument,
  ApplyEntitlementsSequenceToUserMutation,
  ApplyEntitlementsSequenceToUserDocument,
  RemoveEntitledUserMutation,
  RemoveEntitledUserDocument,
  ApplyEntitlementsSetToUsersMutation,
  ApplyEntitlementsSetToUsersDocument,
  GetEntitlementDefinitionQuery,
  EntitlementDefinition,
  GetEntitlementDefinitionDocument,
  ListEntitlementDefinitionsQuery,
  ListEntitlementDefinitionsDocument,
} from '../gen/graphqlTypes'
import { AdminApiClient, AdminConsoleProject } from './adminApiClient'

describe('AdminApiClient test suite', () => {
  const adminApiKey = 'admin-api-key'
  const config: AdminConsoleProject = {
    region: 'us-east-1',
    apiUrl:
      'https://xitd3gs5bfcrtgepuht57zr7z4.appsync-api.us-east-1.amazonaws.com/graphql',
    userPoolId: 'us-east-1_DFsODjKwq',
    clientId: '3svojfatkq6sonb7ium25l7bad',
  }
  const mockConfigurationManager = mock<ConfigurationManager>()
  const mockClient = mock<AWSAppSyncClient<NormalizedCacheObject>>()

  let adminApiClient: AdminApiClient

  beforeEach(() => {
    reset(mockConfigurationManager)
    reset(mockClient)

    when(
      mockConfigurationManager.bindConfigSet<AdminConsoleProject>(
        anything(),
        anything(),
      ),
    ).thenReturn(config)

    adminApiClient = new AdminApiClient(
      adminApiKey,
      instance(mockConfigurationManager),
      instance(mockClient),
    )
  })

  const now = Date.now()
  const externalId = 'external-id'
  const entitlementDefinition: EntitlementDefinition = {
    name: 'entitlement-definition',
    type: 'numeric',
    description: 'description for entitlement-definition',
  }
  const userEntitlements: ExternalUserEntitlements & {
    __typename: 'ExternalUserEntitlements'
  } = {
    __typename: 'ExternalUserEntitlements',
    createdAtEpochMs: now,
    updatedAtEpochMs: now,
    version: 1,
    externalId,
    entitlements: [{ name: 'entitlement-name', value: 1 }],
  }
  const entitlementsSet: EntitlementsSet = {
    createdAtEpochMs: now,
    updatedAtEpochMs: now,
    version: 1,
    name: 'entitlements-set',
    entitlements: [{ name: 'entitlement-name', value: 1 }],
  }
  const entitlementsConsumption: ExternalEntitlementsConsumption = {
    entitlements: userEntitlements,
    consumption: [
      {
        name: 'entitlement-name',
        value: 1,
        available: 1,
        consumed: 0,
        firstConsumedAtEpochMs: 1,
        lastConsumedAtEpochMs: 2,
      },
    ],
  }

  const entitlementsSequenceTransitions: EntitlementsSequenceTransition[] = [
    {
      entitlementsSetName: entitlementsSet.name,
      duration: 'PT1H',
    },
  ]

  const entitlementsSequence: EntitlementsSequence = {
    name: 'entitlements-sequence',
    description: 'entitlements sequence for unit tests',
    createdAtEpochMs: now,
    updatedAtEpochMs: now,
    version: 1,
    transitions: entitlementsSequenceTransitions,
  }

  describe('getEntitlementsForUser tests', () => {
    it('should return results', async () => {
      when(
        mockClient.query<GetEntitlementsForUserQuery>(anything()),
      ).thenResolve({
        data: { getEntitlementsForUser: entitlementsConsumption },
        loading: false,
        stale: false,
        networkStatus: NetworkStatus.ready,
      })

      await expect(
        adminApiClient.getEntitlementsForUser({ externalId }),
      ).resolves.toEqual(entitlementsConsumption)

      const [actualQuery] = capture(mockClient.query as any).first()
      expect(actualQuery).toEqual({
        query: GetEntitlementsForUserDocument,
        variables: { input: { externalId } },
        fetchPolicy: 'network-only',
      })
      verify(mockClient.query(anything())).once()
    })

    it('should throw NoEntitlementsError when returned', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType = 'sudoplatform.NoEntitlementsError'
      when(
        mockClient.query<GetEntitlementsForUserQuery>(anything()),
      ).thenResolve({
        errors: [error],
        data: null as unknown as GetEntitlementsForUserQuery,
        loading: false,
        stale: false,
        networkStatus: NetworkStatus.ready,
      })
      await expect(
        adminApiClient.getEntitlementsForUser({ externalId }),
      ).rejects.toEqual(new NoEntitlementsError())
    })

    it('should throw NoEntitlementsError when thrown', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType = 'sudoplatform.NoEntitlementsError'
      when(
        mockClient.query<GetEntitlementsForUserQuery>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.getEntitlementsForUser({ externalId }),
      ).rejects.toEqual(new NoEntitlementsError())
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.query<GetEntitlementsForUserQuery>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.getEntitlementsForUser({ externalId }),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('getEntitlementsSet tests', () => {
    it('should return results', async () => {
      when(mockClient.query<GetEntitlementsSetQuery>(anything())).thenResolve({
        data: { getEntitlementsSet: entitlementsSet },
        loading: false,
        stale: false,
        networkStatus: NetworkStatus.ready,
      })

      await expect(
        adminApiClient.getEntitlementsSet({ name: entitlementsSet.name }),
      ).resolves.toEqual(entitlementsSet)

      const [actualQuery] = capture(mockClient.query as any).first()
      expect(actualQuery).toEqual({
        query: GetEntitlementsSetDocument,
        variables: { input: { name: entitlementsSet.name } },
        fetchPolicy: 'network-only',
      })
      verify(mockClient.query(anything())).once()
    })

    it.each`
      result
      ${undefined}
      ${null}
    `('should return null for result $result', async ({ result }) => {
      when(mockClient.query<GetEntitlementsSetQuery>(anything())).thenResolve({
        data: { getEntitlementsSet: result },
        loading: false,
        stale: false,
        networkStatus: NetworkStatus.ready,
      })

      await expect(
        adminApiClient.getEntitlementsSet({ name: entitlementsSet.name }),
      ).resolves.toEqual(null)

      const [actualQuery] = capture(mockClient.query as any).first()
      expect(actualQuery).toEqual({
        query: GetEntitlementsSetDocument,
        variables: { input: { name: entitlementsSet.name } },
        fetchPolicy: 'network-only',
      })
      verify(mockClient.query(anything())).once()
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(mockClient.query<GetEntitlementsSetQuery>(anything())).thenReject(
        error,
      )

      await expect(
        adminApiClient.getEntitlementsSet({ name: entitlementsSet.name }),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('listEntitlementsSets tests', () => {
    it('should return results', async () => {
      when(mockClient.query<ListEntitlementsSetsQuery>(anything())).thenResolve(
        {
          data: {
            listEntitlementsSets: {
              items: [entitlementsSet],
            },
          },
          loading: false,
          stale: false,
          networkStatus: NetworkStatus.ready,
        },
      )

      await expect(adminApiClient.listEntitlementsSets()).resolves.toEqual({
        items: [entitlementsSet],
      })

      const [actualQuery] = capture(mockClient.query as any).first()
      expect(actualQuery).toEqual({
        query: ListEntitlementsSetsDocument,
        variables: { nextToken: null },
        fetchPolicy: 'network-only',
      })
      verify(mockClient.query(anything())).once()
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(mockClient.query<ListEntitlementsSetsQuery>(anything())).thenReject(
        error,
      )

      await expect(adminApiClient.listEntitlementsSets()).rejects.toThrow(
        new UnknownGraphQLError(error),
      )
    })
  })

  describe('getEntitlementDefinition tests', () => {
    it('should return results', async () => {
      when(
        mockClient.query<GetEntitlementDefinitionQuery>(anything()),
      ).thenResolve({
        data: { getEntitlementDefinition: entitlementDefinition },
        loading: false,
        stale: false,
        networkStatus: NetworkStatus.ready,
      })

      await expect(
        adminApiClient.getEntitlementDefinition({
          name: entitlementDefinition.name,
        }),
      ).resolves.toEqual(entitlementDefinition)

      const [actualQuery] = capture(mockClient.query as any).first()
      expect(actualQuery).toEqual({
        query: GetEntitlementDefinitionDocument,
        variables: { input: { name: entitlementDefinition.name } },
        fetchPolicy: 'network-only',
      })
      verify(mockClient.query(anything())).once()
    })

    it.each`
      result
      ${undefined}
      ${null}
    `('should return null for result $result', async ({ result }) => {
      when(
        mockClient.query<GetEntitlementDefinitionQuery>(anything()),
      ).thenResolve({
        data: { getEntitlementDefinition: result },
        loading: false,
        stale: false,
        networkStatus: NetworkStatus.ready,
      })

      await expect(
        adminApiClient.getEntitlementDefinition({
          name: entitlementDefinition.name,
        }),
      ).resolves.toEqual(null)

      const [actualQuery] = capture(mockClient.query as any).first()
      expect(actualQuery).toEqual({
        query: GetEntitlementDefinitionDocument,
        variables: { input: { name: entitlementDefinition.name } },
        fetchPolicy: 'network-only',
      })
      verify(mockClient.query(anything())).once()
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.query<GetEntitlementDefinitionQuery>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.getEntitlementDefinition({
          name: entitlementDefinition.name,
        }),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('listEntitlementDefinitions tests', () => {
    it('should return results', async () => {
      when(
        mockClient.query<ListEntitlementDefinitionsQuery>(anything()),
      ).thenResolve({
        data: {
          listEntitlementDefinitions: {
            items: [entitlementDefinition],
          },
        },
        loading: false,
        stale: false,
        networkStatus: NetworkStatus.ready,
      })

      await expect(
        adminApiClient.listEntitlementDefinitions(),
      ).resolves.toEqual({
        items: [entitlementDefinition],
      })

      const [actualQuery] = capture(mockClient.query as any).first()
      expect(actualQuery).toEqual({
        query: ListEntitlementDefinitionsDocument,
        variables: { nextToken: null },
        fetchPolicy: 'network-only',
      })
      verify(mockClient.query(anything())).once()
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.query<ListEntitlementDefinitionsQuery>(anything()),
      ).thenReject(error)

      await expect(adminApiClient.listEntitlementDefinitions()).rejects.toThrow(
        new UnknownGraphQLError(error),
      )
    })
  })

  describe('addEntitlementsSet tests', () => {
    it('should return results', async () => {
      when(
        mockClient.mutate<AddEntitlementsSetMutation>(anything()),
      ).thenResolve({
        data: { addEntitlementsSet: entitlementsSet },
      })

      await expect(
        adminApiClient.addEntitlementsSet(entitlementsSet),
      ).resolves.toEqual(entitlementsSet)

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: AddEntitlementsSetDocument,
        variables: { input: entitlementsSet },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a FatalError on no result', async () => {
      when(
        mockClient.mutate<AddEntitlementsSetMutation>(anything()),
      ).thenResolve({
        data: null,
      })

      await expect(
        adminApiClient.addEntitlementsSet(entitlementsSet),
      ).rejects.toThrowErrorMatchingSnapshot()

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: AddEntitlementsSetDocument,
        variables: { input: entitlementsSet },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a EntitlementsSetAlreadyExistsError when that error returned', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.EntitlementsSetAlreadyExistsError'

      when(
        mockClient.mutate<AddEntitlementsSetMutation>(anything()),
      ).thenResolve({
        errors: [error],
        data: null,
      })

      await expect(
        adminApiClient.addEntitlementsSet(entitlementsSet),
      ).rejects.toThrow(new EntitlementsSetAlreadyExistsError())
    })

    it('should throw a EntitlementsSetAlreadyExistsError when that error thrown', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.EntitlementsSetAlreadyExistsError'

      when(
        mockClient.mutate<AddEntitlementsSetMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.addEntitlementsSet(entitlementsSet),
      ).rejects.toThrow(new EntitlementsSetAlreadyExistsError())
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.mutate<AddEntitlementsSetMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.addEntitlementsSet(entitlementsSet),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('setEntitlementsSet tests', () => {
    it('should return results', async () => {
      when(
        mockClient.mutate<SetEntitlementsSetMutation>(anything()),
      ).thenResolve({
        data: { setEntitlementsSet: entitlementsSet },
      })

      await expect(
        adminApiClient.setEntitlementsSet(entitlementsSet),
      ).resolves.toEqual(entitlementsSet)

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: SetEntitlementsSetDocument,
        variables: { input: entitlementsSet },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a FatalError on no result', async () => {
      when(
        mockClient.mutate<SetEntitlementsSetMutation>(anything()),
      ).thenResolve({
        data: null,
      })

      await expect(
        adminApiClient.setEntitlementsSet(entitlementsSet),
      ).rejects.toThrowErrorMatchingSnapshot()

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: SetEntitlementsSetDocument,
        variables: { input: entitlementsSet },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a EntitlementsSetImmutableError when returned', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.EntitlementsSetImmutableError'

      when(
        mockClient.mutate<SetEntitlementsSetMutation>(anything()),
      ).thenResolve({
        errors: [error],
        data: null,
      })

      await expect(
        adminApiClient.setEntitlementsSet(entitlementsSet),
      ).rejects.toThrow(new EntitlementsSetImmutableError())
    })

    it('should throw a EntitlementsSetImmutableError when thrown', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.EntitlementsSetImmutableError'

      when(
        mockClient.mutate<SetEntitlementsSetMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.setEntitlementsSet(entitlementsSet),
      ).rejects.toThrow(new EntitlementsSetImmutableError())
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.mutate<SetEntitlementsSetMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.setEntitlementsSet(entitlementsSet),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('removeEntitlementsSet tests', () => {
    it('should return results', async () => {
      when(
        mockClient.mutate<RemoveEntitlementsSetMutation>(anything()),
      ).thenResolve({
        data: { removeEntitlementsSet: entitlementsSet },
      })

      await expect(
        adminApiClient.removeEntitlementsSet({ name: entitlementsSet.name }),
      ).resolves.toEqual(entitlementsSet)

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: RemoveEntitlementsSetDocument,
        variables: { input: { name: entitlementsSet.name } },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it.each`
      result
      ${undefined}
      ${null}
    `('should return null for result $result', async ({ result }) => {
      when(
        mockClient.mutate<RemoveEntitlementsSetMutation>(anything()),
      ).thenResolve({
        data: { removeEntitlementsSet: result },
      })

      await expect(
        adminApiClient.removeEntitlementsSet({ name: entitlementsSet.name }),
      ).resolves.toEqual(null)

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: RemoveEntitlementsSetDocument,
        variables: { input: { name: entitlementsSet.name } },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a FatalError on no result', async () => {
      when(
        mockClient.mutate<RemoveEntitlementsSetMutation>(anything()),
      ).thenResolve({
        data: null,
      })

      await expect(
        adminApiClient.removeEntitlementsSet({ name: entitlementsSet.name }),
      ).rejects.toThrowErrorMatchingSnapshot()

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: RemoveEntitlementsSetDocument,
        variables: { input: { name: entitlementsSet.name } },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.mutate<RemoveEntitlementsSetMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.removeEntitlementsSet({ name: entitlementsSet.name }),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('applyEntitlementsSetToUser tests', () => {
    it('should return results', async () => {
      when(
        mockClient.mutate<ApplyEntitlementsSetToUserMutation>(anything()),
      ).thenResolve({
        data: { applyEntitlementsSetToUser: userEntitlements },
      })

      await expect(
        adminApiClient.applyEntitlementsSetToUser({
          externalId,
          entitlementsSetName: entitlementsSet.name,
        }),
      ).resolves.toEqual(userEntitlements)

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: ApplyEntitlementsSetToUserDocument,
        variables: {
          input: { externalId, entitlementsSetName: entitlementsSet.name },
        },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a FatalError on no result', async () => {
      when(
        mockClient.mutate<ApplyEntitlementsSetToUserMutation>(anything()),
      ).thenResolve({
        data: null,
      })

      await expect(
        adminApiClient.applyEntitlementsSetToUser({
          externalId,
          entitlementsSetName: entitlementsSet.name,
        }),
      ).rejects.toThrowErrorMatchingSnapshot()

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: ApplyEntitlementsSetToUserDocument,
        variables: {
          input: { externalId, entitlementsSetName: entitlementsSet.name },
        },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a EntitlementsSetNotFoundError when returned', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.EntitlementsSetNotFoundError'

      when(
        mockClient.mutate<ApplyEntitlementsSetToUserMutation>(anything()),
      ).thenResolve({
        errors: [error],
        data: null,
      })

      await expect(
        adminApiClient.applyEntitlementsSetToUser({
          externalId,
          entitlementsSetName: entitlementsSet.name,
        }),
      ).rejects.toThrow(new EntitlementsSetNotFoundError())
    })

    it('should throw a EntitlementsSetNotFoundError when thrown', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.EntitlementsSetNotFoundError'

      when(
        mockClient.mutate<ApplyEntitlementsSetToUserMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.applyEntitlementsSetToUser({
          externalId,
          entitlementsSetName: entitlementsSet.name,
        }),
      ).rejects.toThrow(new EntitlementsSetNotFoundError())
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.mutate<ApplyEntitlementsSetToUserMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.applyEntitlementsSetToUser({
          externalId,
          entitlementsSetName: entitlementsSet.name,
        }),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('applyEntitlementsSetToUsers tests', () => {
    it('should return results', async () => {
      when(
        mockClient.mutate<ApplyEntitlementsSetToUsersMutation>(anything()),
      ).thenResolve({
        data: { applyEntitlementsSetToUsers: [userEntitlements] },
      })

      await expect(
        adminApiClient.applyEntitlementsSetToUsers({
          operations: [
            {
              externalId,
              entitlementsSetName: entitlementsSet.name,
            },
          ],
        }),
      ).resolves.toEqual([userEntitlements])

      verify(mockClient.mutate(anything())).once()
      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: ApplyEntitlementsSetToUsersDocument,
        variables: {
          input: {
            operations: [
              { externalId, entitlementsSetName: entitlementsSet.name },
            ],
          },
        },
        fetchPolicy: 'no-cache',
      })
    })

    it('should throw a FatalError on no result', async () => {
      when(
        mockClient.mutate<ApplyEntitlementsSetToUsersMutation>(anything()),
      ).thenResolve({
        data: null,
      })

      await expect(
        adminApiClient.applyEntitlementsSetToUsers({
          operations: [
            {
              externalId,
              entitlementsSetName: entitlementsSet.name,
            },
          ],
        }),
      ).rejects.toThrowErrorMatchingSnapshot()

      verify(mockClient.mutate(anything())).once()
      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: ApplyEntitlementsSetToUsersDocument,
        variables: {
          input: {
            operations: [
              { externalId, entitlementsSetName: entitlementsSet.name },
            ],
          },
        },
        fetchPolicy: 'no-cache',
      })
    })

    it('should return error result with a EntitlementsSetNotFoundError when returned', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.EntitlementsSetNotFoundError'

      when(
        mockClient.mutate<ApplyEntitlementsSetToUserMutation>(anything()),
      ).thenResolve({
        errors: [error],
        data: null,
      })

      await expect(
        adminApiClient.applyEntitlementsSetToUser({
          externalId,
          entitlementsSetName: entitlementsSet.name,
        }),
      ).rejects.toThrow(new EntitlementsSetNotFoundError())
    })

    it('should throw a EntitlementsSetNotFoundError when thrown', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.EntitlementsSetNotFoundError'

      when(
        mockClient.mutate<ApplyEntitlementsSetToUserMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.applyEntitlementsSetToUser({
          externalId,
          entitlementsSetName: entitlementsSet.name,
        }),
      ).rejects.toThrow(new EntitlementsSetNotFoundError())
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.mutate<ApplyEntitlementsSetToUserMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.applyEntitlementsSetToUser({
          externalId,
          entitlementsSetName: entitlementsSet.name,
        }),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('applyEntitlementsToUser tests', () => {
    it('should return results', async () => {
      when(
        mockClient.mutate<ApplyEntitlementsToUserMutation>(anything()),
      ).thenResolve({
        data: { applyEntitlementsToUser: userEntitlements },
      })

      await expect(
        adminApiClient.applyEntitlementsToUser({
          externalId,
          entitlements: userEntitlements.entitlements,
        }),
      ).resolves.toEqual(userEntitlements)

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: ApplyEntitlementsToUserDocument,
        variables: {
          input: { externalId, entitlements: userEntitlements.entitlements },
        },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a FatalError on no result', async () => {
      when(
        mockClient.mutate<ApplyEntitlementsToUserMutation>(anything()),
      ).thenResolve({
        data: null,
      })

      await expect(
        adminApiClient.applyEntitlementsToUser({
          externalId,
          entitlements: userEntitlements.entitlements,
        }),
      ).rejects.toThrowErrorMatchingSnapshot()

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: ApplyEntitlementsToUserDocument,
        variables: {
          input: { externalId, entitlements: userEntitlements.entitlements },
        },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a InvalidEntitlementsError when returned', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.InvalidEntitlementsError'

      when(
        mockClient.mutate<ApplyEntitlementsToUserMutation>(anything()),
      ).thenResolve({
        errors: [error],
        data: null,
      })

      await expect(
        adminApiClient.applyEntitlementsToUser({
          externalId,
          entitlements: userEntitlements.entitlements,
        }),
      ).rejects.toThrow(new InvalidEntitlementsError())
    })

    it('should throw a InvalidEntitlementsError when thrown', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.InvalidEntitlementsError'

      when(
        mockClient.mutate<ApplyEntitlementsToUserMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.applyEntitlementsToUser({
          externalId,
          entitlements: userEntitlements.entitlements,
        }),
      ).rejects.toThrow(new InvalidEntitlementsError())
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.mutate<ApplyEntitlementsToUserMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.applyEntitlementsToUser({
          externalId,
          entitlements: userEntitlements.entitlements,
        }),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('getEntitlementsSequence tests', () => {
    it('should return results', async () => {
      when(
        mockClient.query<GetEntitlementsSequenceQuery>(anything()),
      ).thenResolve({
        data: { getEntitlementsSequence: entitlementsSequence },
        loading: false,
        stale: false,
        networkStatus: NetworkStatus.ready,
      })

      await expect(
        adminApiClient.getEntitlementsSequence({
          name: entitlementsSequence.name,
        }),
      ).resolves.toEqual(entitlementsSequence)

      const [actualQuery] = capture(mockClient.query as any).first()
      expect(actualQuery).toEqual({
        query: GetEntitlementsSequenceDocument,
        variables: { input: { name: entitlementsSequence.name } },
        fetchPolicy: 'network-only',
      })
      verify(mockClient.query(anything())).once()
    })

    it.each`
      result
      ${undefined}
      ${null}
    `('should return null for result $result', async ({ result }) => {
      when(
        mockClient.query<GetEntitlementsSequenceQuery>(anything()),
      ).thenResolve({
        data: { getEntitlementsSequence: result },
        loading: false,
        stale: false,
        networkStatus: NetworkStatus.ready,
      })

      await expect(
        adminApiClient.getEntitlementsSequence({
          name: entitlementsSequence.name,
        }),
      ).resolves.toEqual(null)

      const [actualQuery] = capture(mockClient.query as any).first()
      expect(actualQuery).toEqual({
        query: GetEntitlementsSequenceDocument,
        variables: { input: { name: entitlementsSequence.name } },
        fetchPolicy: 'network-only',
      })
      verify(mockClient.query(anything())).once()
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.query<GetEntitlementsSequenceQuery>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.getEntitlementsSequence({
          name: entitlementsSequence.name,
        }),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('listEntitlementsSequences tests', () => {
    it('should return results', async () => {
      when(
        mockClient.query<ListEntitlementsSequencesQuery>(anything()),
      ).thenResolve({
        data: {
          listEntitlementsSequences: {
            items: [entitlementsSequence],
          },
        },
        loading: false,
        stale: false,
        networkStatus: NetworkStatus.ready,
      })

      await expect(adminApiClient.listEntitlementsSequences()).resolves.toEqual(
        {
          items: [entitlementsSequence],
        },
      )

      const [actualQuery] = capture(mockClient.query as any).first()
      expect(actualQuery).toEqual({
        query: ListEntitlementsSequencesDocument,
        variables: { nextToken: null },
        fetchPolicy: 'network-only',
      })
      verify(mockClient.query(anything())).once()
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.query<ListEntitlementsSequencesQuery>(anything()),
      ).thenReject(error)

      await expect(adminApiClient.listEntitlementsSequences()).rejects.toThrow(
        new UnknownGraphQLError(error),
      )
    })
  })

  describe('addEntitlementsSequence tests', () => {
    it('should return results', async () => {
      when(
        mockClient.mutate<AddEntitlementsSequenceMutation>(anything()),
      ).thenResolve({
        data: { addEntitlementsSequence: entitlementsSequence },
      })

      await expect(
        adminApiClient.addEntitlementsSequence(entitlementsSequence),
      ).resolves.toEqual(entitlementsSequence)

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: AddEntitlementsSequenceDocument,
        variables: { input: entitlementsSequence },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a FatalError on no result', async () => {
      when(
        mockClient.mutate<AddEntitlementsSequenceMutation>(anything()),
      ).thenResolve({
        data: null,
      })

      await expect(
        adminApiClient.addEntitlementsSequence(entitlementsSequence),
      ).rejects.toThrowErrorMatchingSnapshot()

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: AddEntitlementsSequenceDocument,
        variables: { input: entitlementsSequence },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a EntitlementsSetAlreadyExistsError when returned', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.EntitlementsSetAlreadyExistsError'

      when(
        mockClient.mutate<AddEntitlementsSequenceMutation>(anything()),
      ).thenResolve({
        errors: [error],
        data: null,
      })

      await expect(
        adminApiClient.addEntitlementsSequence(entitlementsSequence),
      ).rejects.toThrow(new EntitlementsSetAlreadyExistsError())
    })

    it('should throw a EntitlementsSetAlreadyExistsError when thrown', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.EntitlementsSetAlreadyExistsError'

      when(
        mockClient.mutate<AddEntitlementsSequenceMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.addEntitlementsSequence(entitlementsSequence),
      ).rejects.toThrow(new EntitlementsSetAlreadyExistsError())
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.mutate<AddEntitlementsSequenceMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.addEntitlementsSequence(entitlementsSequence),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('setEntitlementsSequence tests', () => {
    it('should return results', async () => {
      when(
        mockClient.mutate<SetEntitlementsSequenceMutation>(anything()),
      ).thenResolve({
        data: { setEntitlementsSequence: entitlementsSequence },
      })

      await expect(
        adminApiClient.setEntitlementsSequence(entitlementsSequence),
      ).resolves.toEqual(entitlementsSequence)

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: SetEntitlementsSequenceDocument,
        variables: { input: entitlementsSequence },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a FatalError on no result', async () => {
      when(
        mockClient.mutate<SetEntitlementsSequenceMutation>(anything()),
      ).thenResolve({
        data: null,
      })

      await expect(
        adminApiClient.setEntitlementsSequence(entitlementsSequence),
      ).rejects.toThrowErrorMatchingSnapshot()

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: SetEntitlementsSequenceDocument,
        variables: { input: entitlementsSequence },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.mutate<SetEntitlementsSequenceMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.setEntitlementsSequence(entitlementsSequence),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('removeEntitlementsSequence tests', () => {
    it('should return results', async () => {
      when(
        mockClient.mutate<RemoveEntitlementsSequenceMutation>(anything()),
      ).thenResolve({
        data: { removeEntitlementsSequence: entitlementsSequence },
      })

      await expect(
        adminApiClient.removeEntitlementsSequence({
          name: entitlementsSequence.name,
        }),
      ).resolves.toEqual(entitlementsSequence)

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: RemoveEntitlementsSequenceDocument,
        variables: { input: { name: entitlementsSequence.name } },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it.each`
      result
      ${undefined}
      ${null}
    `('should return null for result $result', async ({ result }) => {
      when(
        mockClient.mutate<RemoveEntitlementsSequenceMutation>(anything()),
      ).thenResolve({
        data: { removeEntitlementsSequence: result },
      })

      await expect(
        adminApiClient.removeEntitlementsSequence({
          name: entitlementsSequence.name,
        }),
      ).resolves.toEqual(null)

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: RemoveEntitlementsSequenceDocument,
        variables: { input: { name: entitlementsSequence.name } },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a FatalError on no result', async () => {
      when(
        mockClient.mutate<RemoveEntitlementsSequenceMutation>(anything()),
      ).thenResolve({
        data: null,
      })

      await expect(
        adminApiClient.removeEntitlementsSequence({
          name: entitlementsSequence.name,
        }),
      ).rejects.toThrowErrorMatchingSnapshot()

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: RemoveEntitlementsSequenceDocument,
        variables: { input: { name: entitlementsSequence.name } },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.mutate<RemoveEntitlementsSequenceMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.removeEntitlementsSequence({
          name: entitlementsSequence.name,
        }),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('applyEntitlementsSequenceToUser tests', () => {
    it('should return results', async () => {
      const now = Date.now()
      const sequencedUserEntitlements = {
        ...userEntitlements,
        transitionsRelativeToEpochMs: now,
      }
      when(
        mockClient.mutate<ApplyEntitlementsSequenceToUserMutation>(anything()),
      ).thenResolve({
        data: {
          applyEntitlementsSequenceToUser: sequencedUserEntitlements,
        },
      })

      await expect(
        adminApiClient.applyEntitlementsSequenceToUser({
          externalId,
          entitlementsSequenceName: entitlementsSequence.name,
          transitionsRelativeToEpochMs: now,
        }),
      ).resolves.toEqual(sequencedUserEntitlements)

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: ApplyEntitlementsSequenceToUserDocument,
        variables: {
          input: {
            externalId,
            entitlementsSequenceName: entitlementsSequence.name,
            transitionsRelativeToEpochMs: now,
          },
        },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a FatalError on no result', async () => {
      when(
        mockClient.mutate<ApplyEntitlementsSequenceToUserMutation>(anything()),
      ).thenResolve({
        data: null,
      })

      await expect(
        adminApiClient.applyEntitlementsSequenceToUser({
          externalId,
          entitlementsSequenceName: entitlementsSequence.name,
        }),
      ).rejects.toThrowErrorMatchingSnapshot()

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: ApplyEntitlementsSequenceToUserDocument,
        variables: {
          input: {
            externalId,
            entitlementsSequenceName: entitlementsSequence.name,
          },
        },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a EntitlementsSequenceNotFoundError when returned', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.EntitlementsSequenceNotFoundError'

      when(
        mockClient.mutate<ApplyEntitlementsSequenceToUserMutation>(anything()),
      ).thenResolve({
        errors: [error],
        data: null,
      })

      await expect(
        adminApiClient.applyEntitlementsSequenceToUser({
          externalId,
          entitlementsSequenceName: entitlementsSequence.name,
        }),
      ).rejects.toThrow(new EntitlementsSequenceNotFoundError())
    })

    it('should throw a EntitlementsSequenceNotFoundError when thrown', async () => {
      const error: GraphQLError = new GraphQLError('')
      ;(error as AppSyncError).errorType =
        'sudoplatform.entitlements.EntitlementsSequenceNotFoundError'

      when(
        mockClient.mutate<ApplyEntitlementsSequenceToUserMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.applyEntitlementsSequenceToUser({
          externalId,
          entitlementsSequenceName: entitlementsSequence.name,
        }),
      ).rejects.toThrow(new EntitlementsSequenceNotFoundError())
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.mutate<ApplyEntitlementsSequenceToUserMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.applyEntitlementsSequenceToUser({
          externalId,
          entitlementsSequenceName: entitlementsSequence.name,
        }),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('removeEntitledUser tests', () => {
    it('should return results', async () => {
      when(
        mockClient.mutate<RemoveEntitledUserMutation>(anything()),
      ).thenResolve({
        data: { removeEntitledUser: { externalId: 'dummy_external_id' } },
      })

      await expect(
        adminApiClient.removeEntitledUser({ externalId: 'dummy_external_id' }),
      ).resolves.toEqual({ externalId: 'dummy_external_id' })

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: RemoveEntitledUserDocument,
        variables: { input: { externalId: 'dummy_external_id' } },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it.each`
      result
      ${undefined}
      ${null}
    `('should return null for result $result', async ({ result }) => {
      when(
        mockClient.mutate<RemoveEntitledUserMutation>(anything()),
      ).thenResolve({
        data: { removeEntitledUser: result },
      })

      await expect(
        adminApiClient.removeEntitledUser({ externalId: 'dummy_external_id' }),
      ).resolves.toEqual(null)

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: RemoveEntitledUserDocument,
        variables: { input: { externalId: 'dummy_external_id' } },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a FatalError on no result', async () => {
      when(
        mockClient.mutate<RemoveEntitledUserMutation>(anything()),
      ).thenResolve({
        data: null,
      })

      await expect(
        adminApiClient.removeEntitledUser({ externalId: 'dummy_external_id' }),
      ).rejects.toThrowErrorMatchingSnapshot()

      const [actualMutation] = capture(mockClient.mutate as any).first()
      expect(actualMutation).toEqual({
        mutation: RemoveEntitledUserDocument,
        variables: { input: { externalId: 'dummy_external_id' } },
        fetchPolicy: 'no-cache',
      })
      verify(mockClient.mutate(anything())).once()
    })

    it('should throw a UnknownGraphQLError when non sudoplatform error thrown', async () => {
      const error = new Error('some error')

      when(
        mockClient.mutate<RemoveEntitledUserMutation>(anything()),
      ).thenReject(error)

      await expect(
        adminApiClient.removeEntitledUser({ externalId: 'dummy_external_id' }),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })
  })

  describe('graphQLErrorToClientError', () => {
    it.each`
      errorType                                                                | expected
      ${'sudoplatform.entitlements.InvalidEntitlementsError'}                  | ${InvalidEntitlementsError}
      ${'sudoplatform.entitlements.EntitlementsSetInUseError'}                 | ${EntitlementsSetInUseError}
      ${'sudoplatform.entitlements.EntitlementsSetNotFoundError'}              | ${EntitlementsSetNotFoundError}
      ${'sudoplatform.entitlements.EntitlementsSetAlreadyExistsError'}         | ${EntitlementsSetAlreadyExistsError}
      ${'sudoplatform.entitlements.EntitlementsSequenceAlreadyExistsError'}    | ${EntitlementsSequenceAlreadyExistsError}
      ${'sudoplatform.entitlements.EntitlementsSequenceNotFoundError'}         | ${EntitlementsSequenceNotFoundError}
      ${'sudoplatform.entitlements.EntitlementsSetImmutableError'}             | ${EntitlementsSetImmutableError}
      ${'sudoplatform.entitlements.EntitlementsSequenceUpdateInProgressError'} | ${EntitlementsSequenceUpdateInProgressError}
      ${'sudoplatform.entitlements.BulkOperationDuplicateUsersError'}          | ${BulkOperationDuplicateUsersError}
      ${'sudoplatform.entitlements.AlreadyUpdatedError'}                       | ${AlreadyUpdatedError}
      ${'sudoplatform.LimitExceededError'}                                     | ${LimitExceededError}
    `('should map $errorType correctly', ({ errorType, expected }) => {
      expect(
        adminApiClient.graphQLErrorToClientError({
          errorType,
          extensions: {},
          name: '',
          message: '',
          locations: undefined,
          path: undefined,
          nodes: undefined,
          source: undefined,
          positions: undefined,
          originalError: undefined,
        }),
      ).toEqual(new expected())
    })
  })
})
