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
  DefaultSudoEntitlementsAdminClient,
  SudoEntitlementsAdminClient,
} from '..'
import { AdminApiClient } from '../client/adminApiClient'
import { EntitlementsSequenceTransformer } from '../data/transformers/entitlementsSequenceTransformer'
import { EntitlementsSequenceTransitionTransformer } from '../data/transformers/entitlementsSequenceTransitionTransformer'
import { EntitlementsSetTransformer } from '../data/transformers/entitlementsSetTransformer'
import { EntitlementTransformer } from '../data/transformers/entitlementTransformer'
import { ExternalEntitlementsConsumptionTransformer } from '../data/transformers/externalEntitlementsConsumptionTransformer'
import { ExternalUserEntitlementsTransformer } from '../data/transformers/externalUserEntitlementsTransformer'
import { DefaultSudoEntitlementsAdminClientPrivateOptions } from '../private/defaultSudoEntitlementsAdminClientPrivateOptions'
import {
  EntitlementsSequence,
  EntitlementsSequenceTransition,
  EntitlementsSet,
  ExternalEntitlementsConsumption,
  ExternalUserEntitlements,
} from './entitlementsAdminClient'

class TestError extends Error {
  public readonly graphQLErrors?: { errorType: string }[]
  public readonly graphQLErrorType?: string
  public readonly nonGraphQLError?: string
  public constructor(
    args: {
      graphQLErrorType?: string
      nonGraphQLError?: string
    } = {},
  ) {
    super(args.graphQLErrorType ? 'Custom GraphQL error' : args.nonGraphQLError)
    if (args.graphQLErrorType) {
      this.graphQLErrors = [{ errorType: args.graphQLErrorType }]
    }
    this.graphQLErrorType = args.graphQLErrorType
    this.nonGraphQLError = args.nonGraphQLError
  }
}

const sudoPlatformError = new TestError({
  graphQLErrorType: 'sudoplatform.test.SomeError',
})
const nonSudoPlatformError = new TestError({
  graphQLErrorType: 'some.non.sudoplatform.Error',
})
const nonGraphQLError = new TestError({ nonGraphQLError: 'Other error' })

describe('SudoEntitlementsAdminClient test suite', () => {
  const apiKey = 'admin-api-key'
  const mockAdminApiClient = mock<AdminApiClient>()
  let sudoEntitlementsAdminClient: SudoEntitlementsAdminClient

  beforeEach(() => {
    reset(mockAdminApiClient)

    const privateOptions: DefaultSudoEntitlementsAdminClientPrivateOptions = {
      adminApiClient: instance(mockAdminApiClient),
    }
    sudoEntitlementsAdminClient = new DefaultSudoEntitlementsAdminClient(
      apiKey,
      privateOptions,
    )
  })

  const now = new Date()
  const externalId = 'external-id'
  const userEntitlements: ExternalUserEntitlements = {
    createdAt: now,
    updatedAt: now,
    version: 1,
    externalId,
    entitlements: [{ name: 'entitlement-name', value: 1 }],
  }
  const entitlementsSet: EntitlementsSet = {
    createdAt: now,
    updatedAt: now,
    version: 1,
    name: 'entitlements-set',
    entitlements: [{ name: 'entitlement-name', value: 1 }],
  }
  const entitlementsConsumption: ExternalEntitlementsConsumption = {
    entitlements: userEntitlements,
    consumption: [
      {
        name: 'entitlement-name',
        value: 3,
        available: 1,
        consumed: 2,
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
    createdAt: now,
    updatedAt: now,
    version: 1,
    name: 'entitlements-sequence',
    description: 'unit test entitlements sequence',
    transitions: entitlementsSequenceTransitions,
  }

  describe('getEntitlementsForUser tests', () => {
    it('should return entitlements', async () => {
      when(mockAdminApiClient.getEntitlementsForUser(anything())).thenResolve(
        ExternalEntitlementsConsumptionTransformer.toGraphQL(
          entitlementsConsumption,
        ),
      )
      await expect(
        sudoEntitlementsAdminClient.getEntitlementsForUser(externalId),
      ).resolves.toEqual(entitlementsConsumption)

      const [actualInput] = capture(
        mockAdminApiClient.getEntitlementsForUser,
      ).first()
      expect(actualInput).toEqual({ externalId })
      verify(mockAdminApiClient.getEntitlementsForUser(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(mockAdminApiClient.getEntitlementsForUser(anything())).thenReject(
        reject,
      )

      await expect(
        sudoEntitlementsAdminClient.getEntitlementsForUser(externalId),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.getEntitlementsForUser(anything())).once()
    })
  })

  describe('getEntitlementsSet tests', () => {
    it('should return entitlements', async () => {
      when(mockAdminApiClient.getEntitlementsSet(anything())).thenResolve(
        EntitlementsSetTransformer.toGraphQL(entitlementsSet),
      )
      await expect(
        sudoEntitlementsAdminClient.getEntitlementsSet(entitlementsSet.name),
      ).resolves.toEqual(entitlementsSet)

      const [actualInput] = capture(
        mockAdminApiClient.getEntitlementsSet,
      ).first()
      expect(actualInput).toEqual({ name: entitlementsSet.name })
      verify(mockAdminApiClient.getEntitlementsSet(anything())).once()
    })

    it.each`
      result
      ${undefined}
      ${null}
    `('should return undefined for result $result', async ({ result }) => {
      when(mockAdminApiClient.getEntitlementsSet(anything())).thenResolve(
        result,
      )
      await expect(
        sudoEntitlementsAdminClient.getEntitlementsSet(entitlementsSet.name),
      ).resolves.toBeUndefined()

      const [actualInput] = capture(
        mockAdminApiClient.getEntitlementsSet,
      ).first()
      expect(actualInput).toEqual({ name: entitlementsSet.name })
      verify(mockAdminApiClient.getEntitlementsSet(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(mockAdminApiClient.getEntitlementsSet(anything())).thenReject(reject)

      await expect(
        sudoEntitlementsAdminClient.getEntitlementsSet(entitlementsSet.name),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.getEntitlementsSet(anything())).once()
    })
  })

  describe('listEntitlementsSets tests', () => {
    it('should return entitlements for initial call', async () => {
      when(mockAdminApiClient.listEntitlementsSets(anything())).thenResolve({
        items: [EntitlementsSetTransformer.toGraphQL(entitlementsSet)],
      })

      await expect(
        sudoEntitlementsAdminClient.listEntitlementsSets(),
      ).resolves.toEqual({ items: [entitlementsSet] })

      const [actualNextToken] = capture(
        mockAdminApiClient.listEntitlementsSets,
      ).first()
      expect(actualNextToken).toBeUndefined()
      verify(mockAdminApiClient.listEntitlementsSets(anything())).once()
    })
    it('should return entitlements for subsequent call', async () => {
      const nextToken = 'next-token'
      when(mockAdminApiClient.listEntitlementsSets(anything())).thenResolve({
        items: [EntitlementsSetTransformer.toGraphQL(entitlementsSet)],
      })
      await expect(
        sudoEntitlementsAdminClient.listEntitlementsSets(nextToken),
      ).resolves.toEqual({ items: [entitlementsSet] })

      const [actualNextToken] = capture(
        mockAdminApiClient.listEntitlementsSets,
      ).first()
      expect(actualNextToken).toEqual(nextToken)
      verify(mockAdminApiClient.listEntitlementsSets(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(mockAdminApiClient.listEntitlementsSets(anything())).thenReject(
        reject,
      )

      await expect(
        sudoEntitlementsAdminClient.listEntitlementsSets(),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.listEntitlementsSets(anything())).once()
    })
  })

  describe('addEntitlementsSet tests', () => {
    it('should return entitlements', async () => {
      when(mockAdminApiClient.addEntitlementsSet(anything())).thenResolve(
        EntitlementsSetTransformer.toGraphQL(entitlementsSet),
      )
      await expect(
        sudoEntitlementsAdminClient.addEntitlementsSet({
          name: entitlementsSet.name,
          entitlements: entitlementsSet.entitlements,
        }),
      ).resolves.toEqual(entitlementsSet)

      const [actualInput] = capture(
        mockAdminApiClient.addEntitlementsSet,
      ).first()
      expect(actualInput).toEqual({
        name: entitlementsSet.name,
        entitlements: entitlementsSet.entitlements.map(
          EntitlementTransformer.toGraphQL,
        ),
      })
      verify(mockAdminApiClient.addEntitlementsSet(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(mockAdminApiClient.addEntitlementsSet(anything())).thenReject(reject)

      await expect(
        sudoEntitlementsAdminClient.addEntitlementsSet({
          name: entitlementsSet.name,
          entitlements: entitlementsSet.entitlements,
        }),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.addEntitlementsSet(anything())).once()
    })
  })

  describe('setEntitlementsSet tests', () => {
    it('should return entitlements', async () => {
      when(mockAdminApiClient.setEntitlementsSet(anything())).thenResolve(
        EntitlementsSetTransformer.toGraphQL(entitlementsSet),
      )
      await expect(
        sudoEntitlementsAdminClient.setEntitlementsSet({
          name: entitlementsSet.name,
          entitlements: entitlementsSet.entitlements,
        }),
      ).resolves.toEqual(entitlementsSet)

      const [actualInput] = capture(
        mockAdminApiClient.setEntitlementsSet,
      ).first()
      expect(actualInput).toEqual({
        name: entitlementsSet.name,
        entitlements: entitlementsSet.entitlements.map(
          EntitlementTransformer.toGraphQL,
        ),
      })
      verify(mockAdminApiClient.setEntitlementsSet(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(mockAdminApiClient.setEntitlementsSet(anything())).thenReject(reject)

      await expect(
        sudoEntitlementsAdminClient.setEntitlementsSet({
          name: entitlementsSet.name,
          entitlements: entitlementsSet.entitlements,
        }),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.setEntitlementsSet(anything())).once()
    })
  })

  describe('removeEntitlementsSet tests', () => {
    it('should return entitlements set name', async () => {
      when(mockAdminApiClient.removeEntitlementsSet(anything())).thenResolve(
        EntitlementsSetTransformer.toGraphQL(entitlementsSet),
      )
      await expect(
        sudoEntitlementsAdminClient.removeEntitlementsSet(entitlementsSet.name),
      ).resolves.toEqual(entitlementsSet)

      const [actualInput] = capture(
        mockAdminApiClient.removeEntitlementsSet,
      ).first()
      expect(actualInput).toEqual({ name: entitlementsSet.name })
      verify(mockAdminApiClient.removeEntitlementsSet(anything())).once()
    })

    it.each`
      result
      ${undefined}
      ${null}
    `('should return undefined for result $result', async ({ result }) => {
      when(mockAdminApiClient.removeEntitlementsSet(anything())).thenResolve(
        result,
      )
      await expect(
        sudoEntitlementsAdminClient.removeEntitlementsSet(entitlementsSet.name),
      ).resolves.toBeUndefined()

      const [actualInput] = capture(
        mockAdminApiClient.removeEntitlementsSet,
      ).first()
      expect(actualInput).toEqual({ name: entitlementsSet.name })
      verify(mockAdminApiClient.removeEntitlementsSet(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(mockAdminApiClient.removeEntitlementsSet(anything())).thenReject(
        reject,
      )

      await expect(
        sudoEntitlementsAdminClient.removeEntitlementsSet(entitlementsSet.name),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.removeEntitlementsSet(anything())).once()
    })
  })

  describe('applyEntitlementsSetToUser tests', () => {
    it('should return entitlements', async () => {
      when(
        mockAdminApiClient.applyEntitlementsSetToUser(anything()),
      ).thenResolve(
        ExternalUserEntitlementsTransformer.toGraphQL(userEntitlements),
      )

      await expect(
        sudoEntitlementsAdminClient.applyEntitlementsSetToUser(
          externalId,
          entitlementsSet.name,
        ),
      ).resolves.toEqual(userEntitlements)

      const [actualInput] = capture(
        mockAdminApiClient.applyEntitlementsSetToUser,
      ).first()
      expect(actualInput).toEqual({
        externalId,
        entitlementsSetName: entitlementsSet.name,
      })
      verify(mockAdminApiClient.applyEntitlementsSetToUser(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(
        mockAdminApiClient.applyEntitlementsSetToUser(anything()),
      ).thenReject(reject)

      await expect(
        sudoEntitlementsAdminClient.applyEntitlementsSetToUser(
          externalId,
          entitlementsSet.name,
        ),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.applyEntitlementsSetToUser(anything())).once()
    })
  })

  describe('applyEntitlementsToUser tests', () => {
    it('should return entitlements', async () => {
      when(mockAdminApiClient.applyEntitlementsToUser(anything())).thenResolve(
        ExternalUserEntitlementsTransformer.toGraphQL(userEntitlements),
      )

      await expect(
        sudoEntitlementsAdminClient.applyEntitlementsToUser(
          externalId,
          entitlementsSet.entitlements,
        ),
      ).resolves.toEqual(userEntitlements)

      const [actualInput] = capture(
        mockAdminApiClient.applyEntitlementsToUser,
      ).first()
      expect(actualInput).toEqual({
        externalId,
        entitlements: entitlementsSet.entitlements.map(
          EntitlementTransformer.toGraphQL,
        ),
      })
      verify(mockAdminApiClient.applyEntitlementsToUser(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(mockAdminApiClient.applyEntitlementsToUser(anything())).thenReject(
        reject,
      )

      await expect(
        sudoEntitlementsAdminClient.applyEntitlementsToUser(
          externalId,
          entitlementsSet.entitlements,
        ),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.applyEntitlementsToUser(anything())).once()
    })
  })

  describe('getEntitlementsSequence tests', () => {
    it('should return entitlements', async () => {
      when(mockAdminApiClient.getEntitlementsSequence(anything())).thenResolve(
        EntitlementsSequenceTransformer.toGraphQL(entitlementsSequence),
      )
      await expect(
        sudoEntitlementsAdminClient.getEntitlementsSequence(
          entitlementsSequence.name,
        ),
      ).resolves.toEqual(entitlementsSequence)

      const [actualInput] = capture(
        mockAdminApiClient.getEntitlementsSequence,
      ).first()
      expect(actualInput).toEqual({ name: entitlementsSequence.name })
      verify(mockAdminApiClient.getEntitlementsSequence(anything())).once()
    })

    it.each`
      result
      ${undefined}
      ${null}
    `('should return undefined for result $result', async ({ result }) => {
      when(mockAdminApiClient.getEntitlementsSequence(anything())).thenResolve(
        result,
      )
      await expect(
        sudoEntitlementsAdminClient.getEntitlementsSequence(
          entitlementsSequence.name,
        ),
      ).resolves.toBeUndefined()

      const [actualInput] = capture(
        mockAdminApiClient.getEntitlementsSequence,
      ).first()
      expect(actualInput).toEqual({ name: entitlementsSequence.name })
      verify(mockAdminApiClient.getEntitlementsSequence(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(mockAdminApiClient.getEntitlementsSequence(anything())).thenReject(
        reject,
      )

      await expect(
        sudoEntitlementsAdminClient.getEntitlementsSequence(
          entitlementsSequence.name,
        ),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.getEntitlementsSequence(anything())).once()
    })
  })

  describe('listEntitlementsSequences tests', () => {
    it('should return entitlements sequences for initial call', async () => {
      when(
        mockAdminApiClient.listEntitlementsSequences(anything()),
      ).thenResolve({
        items: [
          EntitlementsSequenceTransformer.toGraphQL(entitlementsSequence),
        ],
      })

      await expect(
        sudoEntitlementsAdminClient.listEntitlementsSequences(),
      ).resolves.toEqual({ items: [entitlementsSequence] })

      const [actualNextToken] = capture(
        mockAdminApiClient.listEntitlementsSequences,
      ).first()
      expect(actualNextToken).toBeUndefined()
      verify(mockAdminApiClient.listEntitlementsSequences(anything())).once()
    })
    it('should return entitlements sequences for subsequent call', async () => {
      const nextToken = 'next-token'
      when(
        mockAdminApiClient.listEntitlementsSequences(anything()),
      ).thenResolve({
        items: [
          EntitlementsSequenceTransformer.toGraphQL(entitlementsSequence),
        ],
      })
      await expect(
        sudoEntitlementsAdminClient.listEntitlementsSequences(nextToken),
      ).resolves.toEqual({ items: [entitlementsSequence] })

      const [actualNextToken] = capture(
        mockAdminApiClient.listEntitlementsSequences,
      ).first()
      expect(actualNextToken).toEqual(nextToken)
      verify(mockAdminApiClient.listEntitlementsSequences(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(mockAdminApiClient.listEntitlementsSequences(anything())).thenReject(
        reject,
      )

      await expect(
        sudoEntitlementsAdminClient.listEntitlementsSequences(),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.listEntitlementsSequences(anything())).once()
    })
  })

  describe('addEntitlementsSequence tests', () => {
    it('should return entitlements sequence', async () => {
      when(mockAdminApiClient.addEntitlementsSequence(anything())).thenResolve(
        EntitlementsSequenceTransformer.toGraphQL(entitlementsSequence),
      )
      await expect(
        sudoEntitlementsAdminClient.addEntitlementsSequence({
          name: entitlementsSequence.name,
          description: entitlementsSequence.description,
          transitions: entitlementsSequence.transitions,
        }),
      ).resolves.toEqual(entitlementsSequence)

      const [actualInput] = capture(
        mockAdminApiClient.addEntitlementsSequence,
      ).first()
      expect(actualInput).toEqual({
        name: entitlementsSequence.name,
        description: entitlementsSequence.description,
        transitions: entitlementsSequence.transitions.map(
          EntitlementsSequenceTransitionTransformer.toGraphQL,
        ),
      })
      verify(mockAdminApiClient.addEntitlementsSequence(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(mockAdminApiClient.addEntitlementsSequence(anything())).thenReject(
        reject,
      )

      await expect(
        sudoEntitlementsAdminClient.addEntitlementsSequence({
          name: entitlementsSequence.name,
          description: entitlementsSequence.description,
          transitions: entitlementsSequence.transitions,
        }),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.addEntitlementsSequence(anything())).once()
    })
  })

  describe('setEntitlementsSequence tests', () => {
    it('should return entitlements', async () => {
      when(mockAdminApiClient.setEntitlementsSequence(anything())).thenResolve(
        EntitlementsSequenceTransformer.toGraphQL(entitlementsSequence),
      )
      await expect(
        sudoEntitlementsAdminClient.setEntitlementsSequence({
          name: entitlementsSequence.name,
          description: entitlementsSequence.description,
          transitions: entitlementsSequence.transitions,
        }),
      ).resolves.toEqual(entitlementsSequence)

      const [actualInput] = capture(
        mockAdminApiClient.setEntitlementsSequence,
      ).first()
      expect(actualInput).toEqual({
        name: entitlementsSequence.name,
        description: entitlementsSequence.description,
        transitions: entitlementsSequence.transitions.map(
          EntitlementsSequenceTransitionTransformer.toGraphQL,
        ),
      })
      verify(mockAdminApiClient.setEntitlementsSequence(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(mockAdminApiClient.setEntitlementsSequence(anything())).thenReject(
        reject,
      )

      await expect(
        sudoEntitlementsAdminClient.setEntitlementsSequence({
          name: entitlementsSet.name,
          description: entitlementsSequence.description,
          transitions: entitlementsSequence.transitions,
        }),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.setEntitlementsSequence(anything())).once()
    })
  })

  describe('removeEntitlementsSequence tests', () => {
    it('should return entitlements set name', async () => {
      when(
        mockAdminApiClient.removeEntitlementsSequence(anything()),
      ).thenResolve(
        EntitlementsSequenceTransformer.toGraphQL(entitlementsSequence),
      )
      await expect(
        sudoEntitlementsAdminClient.removeEntitlementsSequence(
          entitlementsSequence.name,
        ),
      ).resolves.toEqual(entitlementsSequence)

      const [actualInput] = capture(
        mockAdminApiClient.removeEntitlementsSequence,
      ).first()
      expect(actualInput).toEqual({ name: entitlementsSequence.name })
      verify(mockAdminApiClient.removeEntitlementsSequence(anything())).once()
    })

    it.each`
      result
      ${undefined}
      ${null}
    `('should return undefined for result $result', async ({ result }) => {
      when(
        mockAdminApiClient.removeEntitlementsSequence(anything()),
      ).thenResolve(result)
      await expect(
        sudoEntitlementsAdminClient.removeEntitlementsSequence(
          entitlementsSequence.name,
        ),
      ).resolves.toBeUndefined()

      const [actualInput] = capture(
        mockAdminApiClient.removeEntitlementsSequence,
      ).first()
      expect(actualInput).toEqual({ name: entitlementsSequence.name })
      verify(mockAdminApiClient.removeEntitlementsSequence(anything())).once()
    })

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(
        mockAdminApiClient.removeEntitlementsSequence(anything()),
      ).thenReject(reject)

      await expect(
        sudoEntitlementsAdminClient.removeEntitlementsSequence(
          entitlementsSet.name,
        ),
      ).rejects.toThrowError(new RegExp(message))

      verify(mockAdminApiClient.removeEntitlementsSequence(anything())).once()
    })
  })

  describe('applyEntitlementsSequenceToUser tests', () => {
    it.each`
      withTransitionsRelativeTo
      ${true}
      ${false}
    `(
      'should return entitlements withTransitionsRelativeTo: $withTransitionsRelativeTo',
      async ({ withTransitionsRelativeTo }) => {
        const sequencedUserEntitlements: ExternalUserEntitlements = {
          ...userEntitlements,
          transitionsRelativeTo: withTransitionsRelativeTo ? now : undefined,
        }
        when(
          mockAdminApiClient.applyEntitlementsSequenceToUser(anything()),
        ).thenResolve(
          ExternalUserEntitlementsTransformer.toGraphQL(
            sequencedUserEntitlements,
          ),
        )

        await expect(
          sudoEntitlementsAdminClient.applyEntitlementsSequenceToUser(
            externalId,
            entitlementsSequence.name,
            withTransitionsRelativeTo ? now : undefined,
          ),
        ).resolves.toEqual(sequencedUserEntitlements)

        const [actualInput] = capture(
          mockAdminApiClient.applyEntitlementsSequenceToUser,
        ).first()
        expect(actualInput).toEqual({
          externalId,
          entitlementsSequenceName: entitlementsSequence.name,
          transitionsRelativeToEpochMs: withTransitionsRelativeTo
            ? now.getTime()
            : undefined,
        })
        verify(
          mockAdminApiClient.applyEntitlementsSequenceToUser(anything()),
        ).once()
      },
    )

    it.each`
      test                          | reject                  | message
      ${'sudoplatform GraphQL'}     | ${sudoPlatformError}    | ${sudoPlatformError.graphQLErrorType}
      ${'non-sudoplatform GraphQL'} | ${nonSudoPlatformError} | ${'Custom GraphQL error'}
      ${'non-GraphQL'}              | ${nonGraphQLError}      | ${nonGraphQLError.nonGraphQLError}
    `('should map a $test error', async ({ reject, message }) => {
      when(
        mockAdminApiClient.applyEntitlementsSequenceToUser(anything()),
      ).thenReject(reject)

      await expect(
        sudoEntitlementsAdminClient.applyEntitlementsSequenceToUser(
          externalId,
          entitlementsSet.name,
        ),
      ).rejects.toThrowError(new RegExp(message))

      verify(
        mockAdminApiClient.applyEntitlementsSequenceToUser(anything()),
      ).once()
    })
  })
})
