import { DefaultConfigurationManager } from '@sudoplatform/sudo-common'
import * as dotenv from 'dotenv'
import fs from 'fs'
import { v4 } from 'uuid'

import {
  DefaultSudoEntitlementsAdminClient,
  Entitlement,
  EntitlementsSequenceTransition,
  ExternalUserEntitlements,
  SudoEntitlementsAdminClient,
} from '../../src'

dotenv.config()

require('isomorphic-fetch')

const updatableEntitlement = process.env.ENT_UPDATABLE_ENTITLEMENT
const describeUpdatable = updatableEntitlement ? describe : describe.skip

describe('sudo-entitlements-admin API integration tests', () => {
  jest.setTimeout(90000)

  let sudoEntitlementsAdmin: SudoEntitlementsAdminClient
  let beforeAllComplete = false
  const externalIds: string[] = []

  beforeAll(() => {
    const sudoPlatformConfig =
      process.env.SUDO_PLATFORM_CONFIG ||
      `${__dirname}/../../config/sudoplatformconfig.json`

    expect(sudoPlatformConfig).toMatch(/.+/)

    DefaultConfigurationManager.getInstance().setConfig(
      fs.readFileSync(sudoPlatformConfig).toString(),
    )

    sudoEntitlementsAdmin = new DefaultSudoEntitlementsAdminClient(
      process.env.ADMIN_API_KEY || 'IAM',
    )
    beforeAllComplete = true
  })

  afterAll(async () => {
    beforeAllComplete = false

    await Promise.all(
      externalIds.map(async (externalId) => {
        try {
          await sudoEntitlementsAdmin.removeEntitledUser(externalId)
        } catch (e) {
          console.log({ e }, 'Failed to remove entitled user.')
        }
      }),
    )

    externalIds.length = 0
  }, 30000)

  // Failures in beforeAll do not stop tests executing
  function expectBeforeAllComplete(): void {
    expect({ beforeAllComplete }).toEqual({ beforeAllComplete: true })
  }

  const run = v4()

  describe('Read-only tests', () => {
    it('should successfully read entitlements sets', async () => {
      expectBeforeAllComplete()

      // Bound this at some number
      const maxVerifications = 10
      let verifications = 0

      for (
        let entitlementsSetsConnection =
          await sudoEntitlementsAdmin.listEntitlementsSets();
        entitlementsSetsConnection.nextToken;
        entitlementsSetsConnection =
          await sudoEntitlementsAdmin.listEntitlementsSets(
            entitlementsSetsConnection.nextToken,
          )
      ) {
        for (const listedEntitlementsSet of entitlementsSetsConnection.items) {
          if (verifications > maxVerifications) {
            // Enough
            return
          }

          const gottenEntitlementsSet =
            await sudoEntitlementsAdmin.getEntitlementsSet(
              listedEntitlementsSet.name,
            )

          // It's possible we're running this against an instance where entitlements
          // sets are changing or being deleted so cater for that
          if (gottenEntitlementsSet) {
            expect(gottenEntitlementsSet?.version).toBeGreaterThanOrEqual(
              listedEntitlementsSet.version,
            )
            if (
              gottenEntitlementsSet.version === listedEntitlementsSet.version
            ) {
              expect(gottenEntitlementsSet).toEqual(listedEntitlementsSet)
              ++verifications
            } else {
              expect(gottenEntitlementsSet).toMatchObject({
                name: listedEntitlementsSet.name,
              })
            }
          }
        }
      }
    })

    it('should return undefined when removing a non-existent entitlements set', async () => {
      expectBeforeAllComplete()

      await expect(
        sudoEntitlementsAdmin.removeEntitlementsSet(`does-not-exist:${run}`),
      ).resolves.toBeUndefined()
    })

    it('should successfully list entitlements sequences', async () => {
      expectBeforeAllComplete()

      // Bound this at some number
      const maxVerifications = 10
      let verifications = 0

      for (
        let entitlementsSequencesConnection =
          await sudoEntitlementsAdmin.listEntitlementsSequences();
        entitlementsSequencesConnection.nextToken;
        entitlementsSequencesConnection =
          await sudoEntitlementsAdmin.listEntitlementsSequences(
            entitlementsSequencesConnection.nextToken,
          )
      ) {
        for (const listedEntitlementsSequence of entitlementsSequencesConnection.items) {
          if (verifications > maxVerifications) {
            // Enough
            return
          }

          const gottenEntitlementsSequence =
            await sudoEntitlementsAdmin.getEntitlementsSequence(
              listedEntitlementsSequence.name,
            )

          // It's possible we're running this against an instance where entitlements
          // sets are changing or being deleted so cater for that
          if (gottenEntitlementsSequence) {
            expect(gottenEntitlementsSequence.version).toBeGreaterThanOrEqual(
              listedEntitlementsSequence.version,
            )
            if (
              gottenEntitlementsSequence?.version ===
              listedEntitlementsSequence.version
            ) {
              expect(gottenEntitlementsSequence).toEqual(
                listedEntitlementsSequence,
              )
              ++verifications
            } else {
              expect(gottenEntitlementsSequence).toMatchObject({
                name: listedEntitlementsSequence.name,
              })
            }
          }
        }
      }
    })
  })

  describeUpdatable('Update tests', () => {
    const entitlementsSetsToRemove: { [key: string]: null } = {}
    const entitlementsSequencesToRemove: { [key: string]: null } = {}

    afterAll(async () => {
      if (sudoEntitlementsAdmin) {
        for (const entitlementsSequenceName of Object.keys(
          entitlementsSequencesToRemove,
        )) {
          await sudoEntitlementsAdmin
            .removeEntitlementsSequence(entitlementsSequenceName)
            .catch((err) => {
              console.log(
                `Unable to remove entitlements sequence ${entitlementsSequenceName}: ${err}`,
              )
            })
        }
        for (const entitlementsSetName of Object.keys(
          entitlementsSetsToRemove,
        )) {
          await sudoEntitlementsAdmin
            .removeEntitlementsSet(entitlementsSetName)
            .catch((err) => {
              console.log(
                `Unable to remove entitlements set ${entitlementsSetName}: ${err}`,
              )
            })
        }
      }
    })

    const testEntitlement: Entitlement = {
      name: updatableEntitlement!,
      description: 'Test Entitlement',
      value: 1,
    }

    it('should be able to add and remove an entitlements set', async () => {
      expectBeforeAllComplete()

      const description = 'add-and-remove'
      const name = `${description}:${run}`
      const input = {
        name,
        description,
        entitlements: [testEntitlement],
      }
      const added = await sudoEntitlementsAdmin.addEntitlementsSet(input)
      entitlementsSetsToRemove[added.name] = null
      expect(added).toMatchObject({ ...input, version: 1 })

      await expect(
        sudoEntitlementsAdmin.removeEntitlementsSet(name),
      ).resolves.toEqual(added)

      delete entitlementsSetsToRemove[added.name]
    })

    it('should be able to apply explicit entitlements to a user and retrieve entitlements consumption', async () => {
      expectBeforeAllComplete()

      const externalId = `apply-explicit:${run}`
      const entitlements = [testEntitlement]

      const applied = await sudoEntitlementsAdmin.applyEntitlementsToUser(
        externalId,
        entitlements,
      )

      externalIds.push(externalId)

      expect(applied).toMatchObject({
        version: 1,
        entitlements,
        entitlementsSetName: undefined,
      })

      const consumption = await sudoEntitlementsAdmin.getEntitlementsForUser(
        externalId,
      )
      expect(consumption.consumption).toHaveLength(0)
      expect(consumption.entitlements).toEqual(applied)

      const entitledUser = await sudoEntitlementsAdmin.removeEntitledUser(
        externalId,
      )
      expect(entitledUser?.externalId).toBe(externalId)
    })

    it('should be able to apply explicit entitlements to multiple users', async () => {
      expectBeforeAllComplete()

      const externalId1 = `apply-explicit-1:${run}`
      const externalId2 = `apply-explicit-2:${run}`
      const entitlements = [testEntitlement]

      const applied = await sudoEntitlementsAdmin.applyEntitlementsToUsers([
        {
          externalId: externalId1,
          entitlements,
        },
        {
          externalId: externalId2,
          entitlements,
        },
      ])

      externalIds.push(externalId1)
      externalIds.push(externalId2)

      expect(applied).toMatchObject([
        {
          externalId: externalId1,
          version: 1,
          entitlements,
          entitlementsSetName: undefined,
        },
        {
          externalId: externalId2,
          version: 1,
          entitlements,
          entitlementsSetName: undefined,
        },
      ])

      await expect(
        sudoEntitlementsAdmin.getEntitlementsForUser(externalId1),
      ).resolves.toMatchObject({
        consumption: [],
        entitlements: applied[0],
      })

      await expect(
        sudoEntitlementsAdmin.getEntitlementsForUser(externalId2),
      ).resolves.toMatchObject({
        consumption: [],
        entitlements: applied[1],
      })

      await expect(
        sudoEntitlementsAdmin.removeEntitledUser(externalId1),
      ).resolves.toEqual({ externalId: externalId1 })
      await expect(
        sudoEntitlementsAdmin.removeEntitledUser(externalId2),
      ).resolves.toEqual({ externalId: externalId2 })
    })

    it('should be able to apply entitlements set to a user and retrieve entitlements consumption', async () => {
      expectBeforeAllComplete()

      const externalId = `apply-set:${run}`

      const description = 'apply-set'
      const name = `${description}:${run}`
      const input = {
        name,
        description,
        entitlements: [testEntitlement],
      }
      const added = await sudoEntitlementsAdmin.addEntitlementsSet(input)
      entitlementsSetsToRemove[added.name] = null
      expect(added).toMatchObject({ ...input, version: 1 })

      const applied = await sudoEntitlementsAdmin.applyEntitlementsSetToUser(
        externalId,
        name,
      )

      externalIds.push(externalId)

      expect(applied).toMatchObject({
        version: 1 + added.version / 100000,
        entitlements: input.entitlements,
        entitlementsSetName: name,
      })

      const consumption = await sudoEntitlementsAdmin.getEntitlementsForUser(
        externalId,
      )
      expect(consumption.consumption).toHaveLength(0)
      expect(consumption.entitlements).toEqual(applied)
    })

    it('should be able to apply entitlements set to multiple users and retrieve entitlements consumption', async () => {
      expectBeforeAllComplete()

      const externalId1 = `apply-set-1:${run}`
      const externalId2 = `apply-set-2:${run}`

      const description1 = 'apply-set-1'
      const name1 = `${description1}:${run}`
      const input1 = {
        name: name1,
        description: description1,
        entitlements: [testEntitlement],
      }
      const description2 = 'apply-set-2'
      const name2 = `${description2}:${run}`
      const input2 = {
        name: name2,
        description: description2,
        entitlements: [testEntitlement],
      }
      const added1 = await sudoEntitlementsAdmin.addEntitlementsSet(input1)
      entitlementsSetsToRemove[added1.name] = null
      expect(added1).toMatchObject({ ...input1, version: 1 })

      const added2 = await sudoEntitlementsAdmin.addEntitlementsSet(input2)
      entitlementsSetsToRemove[added2.name] = null
      expect(added2).toMatchObject({ ...input2, version: 1 })

      const applied = await sudoEntitlementsAdmin.applyEntitlementsSetToUsers([
        {
          externalId: externalId1,
          entitlementsSetName: name1,
        },
        {
          externalId: externalId2,
          entitlementsSetName: name2,
        },
      ])

      externalIds.push(externalId1)
      externalIds.push(externalId2)

      expect(applied).toHaveLength(2)
      expect(applied[0]).toMatchObject({
        version: 1 + added1.version / 100000,
        entitlements: input1.entitlements,
        entitlementsSetName: name1,
      })
      expect(applied[1]).toMatchObject({
        version: 1 + added2.version / 100000,
        entitlements: input2.entitlements,
        entitlementsSetName: name2,
      })

      await expect(
        sudoEntitlementsAdmin.getEntitlementsForUser(externalId1),
      ).resolves.toMatchObject({
        consumption: [],
        entitlements: applied[0],
      })

      await expect(
        sudoEntitlementsAdmin.getEntitlementsForUser(externalId2),
      ).resolves.toMatchObject({
        consumption: [],
        entitlements: applied[1],
      })
    })

    it('should be able to apply entitlements sequence to multiple users and retrieve entitlements consumption', async () => {
      expectBeforeAllComplete()

      const externalId1 = `apply-seq-1:${run}`
      const externalId2 = `apply-seq-2:${run}`

      const description1 = 'apply-seq-1'
      const name1 = `${description1}:${run}`
      const description2 = 'apply-seq-2'
      const name2 = `${description2}:${run}`

      const setInput1 = {
        name: name1,
        description: description1,
        entitlements: [testEntitlement],
      }
      const setInput2 = {
        name: name2,
        description: description2,
        entitlements: [testEntitlement],
      }

      const addedSet1 = await sudoEntitlementsAdmin.addEntitlementsSet(
        setInput1,
      )
      entitlementsSetsToRemove[addedSet1.name] = null
      expect(addedSet1).toMatchObject({ ...setInput1, version: 1 })

      const addedSet2 = await sudoEntitlementsAdmin.addEntitlementsSet(
        setInput2,
      )
      entitlementsSetsToRemove[addedSet2.name] = null
      expect(addedSet2).toMatchObject({ ...setInput2, version: 1 })

      const addedSeq1 = await sudoEntitlementsAdmin.addEntitlementsSequence({
        name: name1,
        description: description1,
        transitions: [{ entitlementsSetName: name1 }],
      })
      entitlementsSequencesToRemove[addedSeq1.name] = null

      const addedSeq2 = await sudoEntitlementsAdmin.addEntitlementsSequence({
        name: name2,
        description: description2,
        transitions: [{ entitlementsSetName: name2 }],
      })
      entitlementsSequencesToRemove[addedSeq2.name] = null

      const applied =
        await sudoEntitlementsAdmin.applyEntitlementsSequenceToUsers([
          {
            externalId: externalId1,
            entitlementsSequenceName: name1,
          },
          {
            externalId: externalId2,
            entitlementsSequenceName: name2,
          },
        ])

      externalIds.push(externalId1)
      externalIds.push(externalId2)

      expect(applied).toHaveLength(2)
      expect(applied[0]).toMatchObject({
        version: 1 + addedSet1.version / 100000,
        entitlements: setInput1.entitlements,
        entitlementsSetName: name1,
        entitlementsSequenceName: name1,
      })
      expect(applied[1]).toMatchObject({
        version: 1 + addedSet2.version / 100000,
        entitlements: setInput2.entitlements,
        entitlementsSetName: name2,
        entitlementsSequenceName: name2,
      })

      await expect(
        sudoEntitlementsAdmin.getEntitlementsForUser(externalId1),
      ).resolves.toMatchObject({
        consumption: [],
        entitlements: applied[0],
      })

      await expect(
        sudoEntitlementsAdmin.getEntitlementsForUser(externalId2),
      ).resolves.toMatchObject({
        consumption: [],
        entitlements: applied[1],
      })
    })

    it('should be able to add and remove an entitlements sequence', async () => {
      expectBeforeAllComplete()

      const description = 'add-and-remove-for-sequence'
      const name = `${description}:${run}`
      const addSetInput = {
        name,
        description,
        entitlements: [testEntitlement],
      }
      const addedSet = await sudoEntitlementsAdmin.addEntitlementsSet(
        addSetInput,
      )
      entitlementsSetsToRemove[addedSet.name] = null
      expect(addedSet).toMatchObject({ ...addSetInput, version: 1 })

      const testEntitlementSequenceTrainsition: EntitlementsSequenceTransition =
        {
          entitlementsSetName: name,
          duration: 'PT1H',
        }

      const addedSequenceInput = {
        name,
        description,
        transitions: [testEntitlementSequenceTrainsition],
      }

      const addedSequence = await sudoEntitlementsAdmin.addEntitlementsSequence(
        addedSequenceInput,
      )
      entitlementsSequencesToRemove[addedSequence.name] = null
      expect(addedSequence).toMatchObject({ ...addedSequenceInput, version: 1 })

      await expect(
        sudoEntitlementsAdmin.removeEntitlementsSequence(name),
      ).resolves.toEqual(addedSequence)
      delete entitlementsSequencesToRemove[addedSequence.name]

      await expect(
        sudoEntitlementsAdmin.removeEntitlementsSet(name),
      ).resolves.toEqual(addedSet)

      delete entitlementsSetsToRemove[addedSet.name]
    })

    it.each`
      withTransitionsRelativeTo
      ${true}
      ${false}
    `(
      'should be able to apply entitlements sequence withTransitionsRelativeTo: $withTransitionsRelativeTo to a user and retrieve entitlements consumption',
      async ({ withTransitionsRelativeTo }) => {
        expectBeforeAllComplete()

        const testId = v4()
        const externalId = `apply-sequence:${testId}`

        const description = 'apply-sequence'
        const name = `${description}:${testId}`
        const input = {
          name,
          description,
          entitlements: [testEntitlement],
        }
        const added = await sudoEntitlementsAdmin.addEntitlementsSet(input)
        entitlementsSetsToRemove[added.name] = null
        expect(added).toMatchObject({ ...input, version: 1 })

        const testEntitlementSequenceTransition: EntitlementsSequenceTransition =
          {
            entitlementsSetName: name,
            duration: 'PT1H',
          }

        const addedSequenceInput = {
          name,
          description,
          transitions: [testEntitlementSequenceTransition],
        }

        const addedSequence =
          await sudoEntitlementsAdmin.addEntitlementsSequence(
            addedSequenceInput,
          )
        entitlementsSequencesToRemove[addedSequence.name] = null
        expect(addedSequence).toMatchObject({
          ...addedSequenceInput,
          version: 1,
        })

        let applied: ExternalUserEntitlements
        const now = new Date()
        if (withTransitionsRelativeTo) {
          applied = await sudoEntitlementsAdmin.applyEntitlementsSequenceToUser(
            externalId,
            name,
            now,
          )

          externalIds.push(externalId)

          expect(applied).toMatchObject({
            version: 1 + added.version / 100000,
            entitlements: input.entitlements,
            entitlementsSetName: name,
            transitionsRelativeTo: now,
          })
        } else {
          applied = await sudoEntitlementsAdmin.applyEntitlementsSequenceToUser(
            externalId,
            name,
          )

          expect(applied).toMatchObject({
            version: 1 + added.version / 100000,
            entitlements: input.entitlements,
            entitlementsSetName: name,
          })
          expect(applied.transitionsRelativeTo).toBeUndefined()
        }

        const consumption = await sudoEntitlementsAdmin.getEntitlementsForUser(
          externalId,
        )
        expect(consumption.consumption).toHaveLength(0)
        expect(consumption.entitlements).toEqual(applied)
      },
    )

    it('should be able to add and update an entitlements sequence', async () => {
      expectBeforeAllComplete()

      const description = 'add-and-update-for-sequence'
      const name = `${description}:${run}`
      const addSetInput = {
        name,
        description,
        entitlements: [testEntitlement],
      }
      const addedSet = await sudoEntitlementsAdmin.addEntitlementsSet(
        addSetInput,
      )
      entitlementsSetsToRemove[addedSet.name] = null
      expect(addedSet).toMatchObject({ ...addSetInput, version: 1 })

      const testEntitlementSequenceTrainsition: EntitlementsSequenceTransition =
        {
          entitlementsSetName: name,
          duration: 'PT1H',
        }

      const addedSequenceInput = {
        name,
        description,
        transitions: [testEntitlementSequenceTrainsition],
      }

      const addedSequence = await sudoEntitlementsAdmin.addEntitlementsSequence(
        addedSequenceInput,
      )
      entitlementsSequencesToRemove[addedSequence.name] = null
      expect(addedSequence).toMatchObject({ ...addedSequenceInput, version: 1 })

      const updateSequenceInput = {
        ...addedSequenceInput,
        description: 'updated now',
      }
      const updatedSequence =
        await sudoEntitlementsAdmin.setEntitlementsSequence(updateSequenceInput)
      expect(updatedSequence).toMatchObject({
        ...updateSequenceInput,
        version: 2,
      })

      await expect(
        sudoEntitlementsAdmin.removeEntitlementsSequence(name),
      ).resolves.toEqual(updatedSequence)
      delete entitlementsSequencesToRemove[addedSequence.name]

      await expect(
        sudoEntitlementsAdmin.removeEntitlementsSet(name),
      ).resolves.toEqual(addedSet)

      delete entitlementsSetsToRemove[addedSet.name]
    })
  })
})
