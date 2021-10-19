/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConfigurationManager } from '@sudoplatform/sudo-common'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { NetworkStatus } from 'apollo-client'
import { AWSAppSyncClient } from 'aws-appsync'
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
  const userEntitlements: ExternalUserEntitlements = {
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
  })
})
