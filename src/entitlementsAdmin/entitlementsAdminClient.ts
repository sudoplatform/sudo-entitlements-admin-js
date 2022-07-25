import { AdminApiClient } from '../client/adminApiClient'
import { EntitlementDefinitionConnectionTransformer } from '../data/transformers/entitlementDefinitionConnectionTransformer'
import { EntitlementDefinitionTransformer } from '../data/transformers/entitlementDefinitionTransformer'
import { EntitlementsSequencesConnectionTransformer } from '../data/transformers/entitlementsSequencesConnectionTransformer'
import { EntitlementsSequenceTransformer } from '../data/transformers/entitlementsSequenceTransformer'
import { EntitlementsSequenceTransitionTransformer } from '../data/transformers/entitlementsSequenceTransitionTransformer'
import { EntitlementsSetsConnectionTransformer } from '../data/transformers/entitlementsSetsConnectionTransformer'
import { EntitlementsSetTransformer } from '../data/transformers/entitlementsSetTransformer'
import { EntitlementTransformer } from '../data/transformers/entitlementTransformer'
import { ExternalEntitlementsConsumptionTransformer } from '../data/transformers/externalEntitlementsConsumptionTransformer'
import { ExternalUserEntitlementsResultTransformer } from '../data/transformers/externalUserEntitlementsResultTransformer'
import { ExternalUserEntitlementsTransformer } from '../data/transformers/externalUserEntitlementsTransformer'
import {
  AddEntitlementsSequenceInput,
  AddEntitlementsSetInput,
  SetEntitlementsSequenceInput,
  SetEntitlementsSetInput,
} from '../gen/graphqlTypes'
import { DefaultSudoEntitlementsAdminClientPrivateOptions } from '../private/defaultSudoEntitlementsAdminClientPrivateOptions'

/**
 * Representation of an entitlement
 */
export interface Entitlement {
  /**
   * Name of the entitlement
   */
  name: string

  /**
   * Description, if any, of the entitlement
   */
  description?: string

  /**
   * Value of the entitlement.
   */
  value: number
}

/**
 * Representation of an entitlement definition
 */
export interface EntitlementDefinition {
  /**
   * Name of the entitlement
   */
  name: string

  /**
   * Description, if any, of the entitlement
   */
  description?: string

  /**
   * Type of the entitlement.
   */
  type: 'numeric' | 'boolean'
}

/**
 * Set of entitlements current for the user
 */
export interface EntitlementsSet {
  /**
   * Time at which the entitlements for the user was originally created
   */
  createdAt: Date

  /**
   * Time at which the entitlements for the user were most recently updated.
   */
  updatedAt: Date

  /**
   * Version number of the user's entitlements. This is incremented every
   * time there is a change of entitlements set or explicit entitlements
   * for this user.
   */
  version: number

  /**
   * Name of the entitlements set specifying this user's entitlements
   * or the user's subject ID if the user's entitlements are specified
   * explicitly rather than by entitlements set name.
   */
  name: string

  /**
   * Description, if any, of the entitlements set as specified by the entitlements
   * set administrator or undefined if user's entitlements are specified explicitly
   * rather than by entitlements set name.
   */
  description?: string

  /**
   * The set of entitlements active for the user. This details the limits
   * of the user's entitlements and does not specify any information regarding
   * current consumption of those entitlements.
   */
  entitlements: Entitlement[]
}

/**
 * Entitled user.
 */
export interface EntitledUser {
  /**
   * External IDP identifier identifying the user
   */
  externalId: string
}
/**
 * Input when creating a new entitlements set
 */
export type NewEntitlementsSet = Omit<
  EntitlementsSet,
  'createdAt' | 'updatedAt' | 'version'
>

/**
 * Paginated entitlements sets result
 */
export interface EntitlementsSetsConnection {
  /**
   * Entitlements sets in this page. May be empty even if there
   * are more entitlements to come.
   */
  items: EntitlementsSet[]

  /**
   * If defined, a further call to listEntitlementsSets is required
   * to complete the full list of entitlements sets.
   */
  nextToken?: string
}

/**
 * Paginated entitlement definition result
 */
export interface EntitlementDefinitionConnection {
  /**
   * Entitlements definitions in this page.
   */
  items: EntitlementDefinition[]

  /**
   * If defined, a further call to listEntitlementDefinitions is required
   * to complete the full list of entitlements definitions.
   */
  nextToken?: string
}

/**
 * Definition of a single transition within an entitlements sequence
 */
export interface EntitlementsSequenceTransition {
  /**
   * Name of entitlements set.
   */
  entitlementsSetName: string

  /**
   * ISO8601 period string - if not specified then this transition
   * is the final state for all users on the sequence.
   */
  duration?: string
}

/**
 * Definition of a sequence of entitlements sets through which a user will transition
 */
export interface EntitlementsSequence {
  /**
   * Time at which the entitlements sequence was originally created
   */
  createdAt: Date

  /**
   * Time at which the entitlements sequence was most recently updated.
   */
  updatedAt: Date

  /**
   * Version number of the entitlements sequence. This is incremented every
   * time there is a change to this entitlements sequence.
   */
  version: number

  /**
   * Name of this entitlements sequence.
   */
  name: string

  /**
   * Description, if any, of the entitlements sequence as specified by the entitlements
   * administrator.
   */
  description?: string

  /**
   * The sequence of transitions a user will go through in order.
   */
  transitions: EntitlementsSequenceTransition[]
}

/**
 * Paginated entitlements sequences result
 */
export interface EntitlementsSequencesConnection {
  /**
   * Entitlements sequences in this page. May be empty even if there
   * are more sequences to come.
   */
  items: EntitlementsSequence[]

  /**
   * If defined, a further call to listEntitlementsSequences is required
   * to complete the full list of entitlements sequences.
   */
  nextToken?: string
}

/**
 * Entitlement consumption information
 */
export interface EntitlementConsumption {
  /**
   * Name of the entitlement
   */
  name: string

  /**
   * Value of the entitlement.
   */
  value: number
  /**
   * Remaining amount of entitlement
   */
  available: number

  /**
   * Consumed amount of entitlement
   */
  consumed: number

  /**
   * The time at which this entitlement was first consumed
   */
  firstConsumedAtEpochMs?: number

  /**
   * The most recent time at which this entitlement was consumed
   */
  lastConsumedAtEpochMs?: number
}

/**
 * Entitlements of a user.
 */
export interface ExternalUserEntitlements {
  /**
   * Time of initial creation of user entitlements mapping.
   */
  createdAt: Date

  /**
   * Time of last updates of user entitlements mapping.
   */
  updatedAt: Date

  /**
   * Version number of the user's entitlements. This is incremented every
   * time there is a change of entitlements set or explicit entitlements
   * for this user.
   *
   * For users entitled by entitlement set, the fractional part of this version
   * specifies the version of the entitlements set itself. Entitlements set version
   * is divided by 100000 then added to the user entitlements version
   *
   * This ensures that the version of user entitlements always increases mon
   */
  version: number

  /**
   * External IDP identifier identifying the user
   */
  externalId: string

  /**
   * Sudo Platform owner. This value matches the subject in identity
   * tokens used to authenticate to Sudo Platform services. Will not
   * be present if the user has not yet redeemed their identity token
   * with the entitlements service.
   */
  owner?: string

  /**
   * Name of the entitlements set specified for this user. Will be undefined
   * if entitlements have been specified explicitly rather than by an
   * entitlements set.
   */
  entitlementsSetName?: string

  /*
   * Name of the entitlements sequence specified for this user. Will be undefined
   * if entitlements have been specified explicitly or by entitlements set
   * rather than by an entitlements sequence name.
   */
  entitlementsSequenceName?: string

  /**
   * Effective entitlements for the user either obtained from the entitlements
   * set or as specified explicitly for this user.
   */
  entitlements: Entitlement[]

  /**
   * Date from when user's transitions should
   * be calculated. Defaults to current time.
   */
  transitionsRelativeTo?: Date
}

/**
 * Operation error for a particular operation of one of the
 * bulk applyEntitlements*ToUsers methods.
 */
export interface ExternalUserEntitlementsError {
  /**
   * Error of failure for the particular operation
   */
  error: Error
}

/**
 * Individual operation result for the bulk applyEntitlements*ToUsers
 * methods
 */
export type ExternalUserEntitlementsResult =
  | ExternalUserEntitlements
  | ExternalUserEntitlementsError

/**
 * Type guard for ExternalUserEntitlementsResult union type
 * @param u ExternalUserEntitlementsResult to check
 * @returns Whether or not u is an ExternalUserEntitlementsError
 */
export function isExternalUserEntitlementsError(
  u: ExternalUserEntitlementsResult,
): u is ExternalUserEntitlementsError {
  return 'error' in u
}

/**
 * Entitlements consumption information
 */
export interface ExternalEntitlementsConsumption {
  entitlements: ExternalUserEntitlements

  /**
   * Entitlement consumption information for each of a user's
   * entitlements. If there is no entry for an entitlement,
   * none of the entitlement has been consumed.
   */
  consumption: EntitlementConsumption[]
}

/**
 * Client responsible for establishing entitlements of federated identities.
 *
 * @beta
 */
export interface SudoEntitlementsAdminClient {
  /**
   * Get an entitlements set
   *
   * @param name Name of the entitlements set to return
   *
   * @returns Named entitlements set or undefined if no entitlements set
   *          of the specified name has been defined.
   */
  getEntitlementsSet(name: string): Promise<EntitlementsSet | undefined>

  /**
   * List all entitlements sets
   *
   * Call again with a token parameter to continue paginated listing
   *
   * @param token Optional token from which to continue listing
   *
   * @returns Paginated list of entitlements sets
   */
  listEntitlementsSets(token?: string): Promise<EntitlementsSetsConnection>

  /**
   * Get an entitlement definition by entitlement name
   *
   * @param name Name of the entitlement definition to return
   *
   * @returns Named entitlements definition or undefined if no entitlement
   *          definition of the specified name has been defined.
   */
  getEntitlementDefinition(
    name: string,
  ): Promise<EntitlementDefinition | undefined>

  /**
   * List all entitlement definitions
   *
   * Call again with a token parameter to continue paginated listing
   *
   * @param limit number of entitlement definitions to be returned per call
   * @param nextToken Optional token from which to continue listing
   *
   * @returns Paginated list of entitlement definitions
   */
  listEntitlementDefinitions(
    limit?: number,
    nextToken?: string,
  ): Promise<EntitlementDefinitionConnection>

  /**
   * Get entitlements for a user
   *
   * @param externalId External IDP user ID of user to retrieve entitlements for
   *
   * @returns Entitlements consumption for the user.
   *
   * @throws NoEntitlementsError
   *  - The user has no entitlements defined
   */
  getEntitlementsForUser(
    externalId: string,
  ): Promise<ExternalEntitlementsConsumption>

  /**
   * Add a new entitlements set
   *
   * @param newEntitlementsSet Definition of new entitlements set
   *
   * @returns The created entitlements set
   *
   * @throws {@link InvalidEntitlementsError}
   *  - Entitlements set contains one or more entitlements with unrecognized names
   */
  addEntitlementsSet(
    newEntitlementsSet: Omit<
      EntitlementsSet,
      'createdAt' | 'updatedAt' | 'version'
    >,
  ): Promise<EntitlementsSet>

  /**
   * Update an entitlements set
   *
   * @param newEntitlementsSet Definition of new entitlements set
   *
   * @returns The updated entitlements set
   *
   * @throws {@link InvalidEntitlementsError}
   *  - Entitlements set contains one or more entitlements with unrecognized names
   */
  setEntitlementsSet(
    newEntitlementsSet: Omit<
      EntitlementsSet,
      'createdAt' | 'updatedAt' | 'version'
    >,
  ): Promise<EntitlementsSet>

  /**
   * Remove entitlements set
   *
   * @param name Name of entitlements set to remove
   *
   * @returns The entitlements set removed or undefined if entitlements set was not present
   */
  removeEntitlementsSet(name: string): Promise<EntitlementsSet | undefined>

  /**
   * Apply entitlements to a user
   *
   * If a record for that user's entitlements does not yet exist it will be created.
   *
   * @param externalId External IDP user ID of user to retrieve entitlements for
   * @param entitlements The entitlements to apply to the user
   *
   * @returns The effective entitlements for the user
   *
   * @throws {@link InvalidEntitlementsError}
   *  - Entitlements contains one or more entitlements with unrecognized names
   */
  applyEntitlementsToUser(
    externalId: string,
    entitlements: Entitlement[],
  ): Promise<ExternalUserEntitlements>

  /**
   * Apply entitlements to users
   *
   * Equivalent of multiple calls to {@link applyEntitlementsToUser}
   *
   * If a record for any user's entitlements does not yet exist it will be created.
   *
   * @param externalId External IDP user ID of user to retrieve entitlements for
   * @param entitlements The entitlements to apply to the user
   *
   * @returns The effective entitlements for the user
   *
   * @throws {@link InvalidEntitlementsError}
   *  - Entitlements contains one or more entitlements with unrecognized names
   */
  applyEntitlementsToUsers(
    operations: {
      externalId: string
      entitlements: Entitlement[]
    }[],
  ): Promise<ExternalUserEntitlementsResult[]>

  /**
   * Apply entitlements set to a user
   *
   * If a record for that user's entitlements does not yet exist it will be created.
   *
   * @param externalId External IDP user ID of user to retrieve entitlements for
   * @param entitlementsSetName Name of the entitlements set to apply to the user
   *
   * @returns The effective entitlements for the user
   *
   * @throws EntitlementSetNotFoundError
   *  - If the named entitlements set does not exist
   *
   * @throws {@link AlreadyUpdatedError}
   *  - if the user's entitlements have been updated with a later version
   */
  applyEntitlementsSetToUser(
    externalId: string,
    entitlementsSetName: string,
  ): Promise<ExternalUserEntitlements>

  /**
   * Apply entitlements sets to users.
   *
   * Equivalent of multiple calls to {@link applyEntitlementsSetToUser}
   *
   * If a record for a user's entitlements does not yet exist it will be created.
   *
   * @param externalId External IDP user ID of user to retrieve entitlements for
   * @param entitlementsSetName Name of the entitlements set to apply to the user
   *
   * @returns The effective entitlements for the user
   *
   * @throws EntitlementSetNotFoundError
   *  - If the named entitlements set does not exist
   *
   * @throws {@link AlreadyUpdatedError}
   *  - if the user's entitlements have been updated with a later version
   */
  applyEntitlementsSetToUsers(
    operations: {
      externalId: string
      entitlementsSetName: string
    }[],
  ): Promise<ExternalUserEntitlementsResult[]>

  /**
   * Get an entitlements sequence
   *
   * @param name Name of the entitlements sequence to return
   *
   * @returns Named entitlements sequence or undefined if no entitlements sequence
   *          of the specified name has been defined.
   */
  getEntitlementsSequence(
    name: string,
  ): Promise<EntitlementsSequence | undefined>

  /**
   * List all entitlements sequences
   *
   * Call again with a token parameter to continue paginated listing
   *
   * @param token Optional token from which to continue listing
   *
   * @returns Paginated list of entitlements sequences
   */
  listEntitlementsSequences(
    nextToken?: string,
  ): Promise<EntitlementsSequencesConnection>

  /**
   * Add a new entitlements sequence
   *
   * @param newEntitlementsSequence Definition of new entitlements sequence
   *
   * @returns The created entitlements sequence
   *
   * @throws InvalidArgumentError
   *  - if the specified entitlements sequence name is invalid
   */
  addEntitlementsSequence(
    newEntitlementsSequence: Omit<
      EntitlementsSequence,
      'createdAt' | 'updatedAt' | 'version'
    >,
  ): Promise<EntitlementsSequence>

  /**
   * Update an entitlements sequence
   *
   * @param newEntitlementsSequence Definition of new entitlements sequence
   *
   * @returns The updated entitlements sequence
   *
   * @throws InvalidArgumentError
   *  - if the specified entitlements sequence name is invalid
   */
  setEntitlementsSequence(
    newEntitlementsSequence: Omit<
      EntitlementsSequence,
      'createdAt' | 'updatedAt' | 'version'
    >,
  ): Promise<EntitlementsSequence>

  /**
   * Remove entitlements sequence
   *
   * @param name Name of entitlements sequence to remove
   *
   * @returns The entitlements sequence removed or undefined if entitlements sequence was not present
   */
  removeEntitlementsSequence(
    name: string,
  ): Promise<EntitlementsSequence | undefined>

  /**
   * Apply entitlements sequence directly to a user
   *
   * If a record for that user's entitlements sequence does not yet exist it will be created.
   *
   * @param externalId External IDP user ID of user to apply entitlements sequence to
   * @param entitlementsSequenceName Name of the entitlements sequence to apply to the user
   *
   * @returns The effective entitlements for the user
   *
   * @throws {@link AlreadyUpdatedError}
   *  - if the user's entitlements have been updated with a later version
   *
   * @throws {@link EntitlementsSequenceNotFoundError}
   * - If the entitlements sequence named is not defined
   */
  applyEntitlementsSequenceToUser(
    externalId: string,
    entitlementsSequenceName: string,
    transitionsRelativeTo?: Date,
  ): Promise<ExternalUserEntitlements>

  /**
   * Apply entitlements sequence to users
   *
   * Equivalent of multiple calls to {@link applyEntitlementsSequenceToUser}
   *
   * If a record for any user's entitlements sequence does not yet exist it will be created.
   *
   * @param externalId External IDP user ID of user to apply entitlements sequence to
   * @param entitlementSequenceName Name of the entitlements sequence to apply to the user
   *
   * @returns The effective entitlements for the user
   *
   * @throws {@link AlreadyUpdatedError}
   *  - if the user's entitlements have been updated with a later version
   *
   * @throws {@link EntitlementsSequenceNotFoundError}
   * - If the entitlements sequence named is not defined
   */
  applyEntitlementsSequenceToUsers(
    operations: {
      externalId: string
      entitlementsSequenceName: string
      transitionsRelativeTo?: Date
    }[],
  ): Promise<ExternalUserEntitlementsResult[]>

  /**
   * Remove entitlements and consumption records of the specified user.
   *
   * @param externalId External IDP user ID of user to remove.
   *
   * @returns The entitled user removed or undefined if the user is not found.
   */
  removeEntitledUser(externalId: string): Promise<EntitledUser | undefined>
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DefaultSudoEntitlementsAdminClientOptions {}

export class DefaultSudoEntitlementsAdminClient
  implements SudoEntitlementsAdminClient
{
  private readonly adminApiClient: AdminApiClient

  public constructor(
    apiKey: string,
    options?: DefaultSudoEntitlementsAdminClientOptions,
  ) {
    const privateOptions = options as
      | DefaultSudoEntitlementsAdminClientPrivateOptions
      | undefined
    this.adminApiClient =
      privateOptions?.adminApiClient ?? new AdminApiClient(apiKey)
  }

  async getEntitlementsSet(name: string): Promise<EntitlementsSet | undefined> {
    const entitlements = await this.adminApiClient.getEntitlementsSet({
      name,
    })
    if (!entitlements) {
      return undefined
    }
    return EntitlementsSetTransformer.toClient(entitlements)
  }

  async listEntitlementsSets(
    nextToken?: string,
  ): Promise<EntitlementsSetsConnection> {
    const entitlementsSetsConnection =
      await this.adminApiClient.listEntitlementsSets(nextToken)
    return EntitlementsSetsConnectionTransformer.toClient(
      entitlementsSetsConnection,
    )
  }

  async getEntitlementDefinition(
    name: string,
  ): Promise<EntitlementDefinition | undefined> {
    const entitlementDefinition =
      await this.adminApiClient.getEntitlementDefinition({
        name,
      })
    if (!entitlementDefinition) {
      return undefined
    }
    return EntitlementDefinitionTransformer.toClient(entitlementDefinition)
  }

  async listEntitlementDefinitions(
    limit?: number,
    nextToken?: string,
  ): Promise<EntitlementDefinitionConnection> {
    const entitlementDefinitionConnection =
      await this.adminApiClient.listEntitlementDefinitions(limit, nextToken)
    return EntitlementDefinitionConnectionTransformer.toClient(
      entitlementDefinitionConnection,
    )
  }

  async getEntitlementsForUser(
    externalId: string,
  ): Promise<ExternalEntitlementsConsumption> {
    const entitlementsConsumption =
      await this.adminApiClient.getEntitlementsForUser({ externalId })
    return ExternalEntitlementsConsumptionTransformer.toClient(
      entitlementsConsumption,
    )
  }

  async addEntitlementsSet(
    newEntitlementsSet: NewEntitlementsSet,
  ): Promise<EntitlementsSet> {
    const input: AddEntitlementsSetInput = {
      name: newEntitlementsSet.name,
      description: newEntitlementsSet.description,
      entitlements: newEntitlementsSet.entitlements.map(
        EntitlementTransformer.toGraphQL,
      ),
    }
    const entitlementsSet = await this.adminApiClient.addEntitlementsSet(input)
    return EntitlementsSetTransformer.toClient(entitlementsSet)
  }

  async setEntitlementsSet(
    newEntitlementsSet: NewEntitlementsSet,
  ): Promise<EntitlementsSet> {
    const input: SetEntitlementsSetInput = {
      name: newEntitlementsSet.name,
      description: newEntitlementsSet.description,
      entitlements: newEntitlementsSet.entitlements.map(
        EntitlementTransformer.toGraphQL,
      ),
    }
    const entitlementsSet = await this.adminApiClient.setEntitlementsSet(input)
    return EntitlementsSetTransformer.toClient(entitlementsSet)
  }

  async removeEntitlementsSet(
    name: string,
  ): Promise<EntitlementsSet | undefined> {
    const removed = await this.adminApiClient.removeEntitlementsSet({
      name,
    })
    if (!removed) {
      return undefined
    }
    return EntitlementsSetTransformer.toClient(removed)
  }

  async applyEntitlementsSetToUser(
    externalId: string,
    entitlementsSetName: string,
  ): Promise<ExternalUserEntitlements> {
    const userEntitlements =
      await this.adminApiClient.applyEntitlementsSetToUser({
        externalId,
        entitlementsSetName,
      })
    return ExternalUserEntitlementsTransformer.toClient(userEntitlements)
  }

  async applyEntitlementsSetToUsers(
    operations: {
      externalId: string
      entitlementsSetName: string
    }[],
  ): Promise<ExternalUserEntitlementsResult[]> {
    const results = await this.adminApiClient.applyEntitlementsSetToUsers({
      operations,
    })
    return results.map(ExternalUserEntitlementsResultTransformer.toClient)
  }

  async applyEntitlementsToUser(
    externalId: string,
    entitlements: Entitlement[],
  ): Promise<ExternalUserEntitlements> {
    const userEntitlements = await this.adminApiClient.applyEntitlementsToUser({
      externalId,
      entitlements: entitlements.map(EntitlementTransformer.toGraphQL),
    })
    return ExternalUserEntitlementsTransformer.toClient(userEntitlements)
  }

  async applyEntitlementsToUsers(
    operations: {
      externalId: string
      entitlements: Entitlement[]
    }[],
  ): Promise<ExternalUserEntitlementsResult[]> {
    const results = await this.adminApiClient.applyEntitlementsToUsers({
      operations: operations.map((o) => ({
        externalId: o.externalId,
        entitlements: o.entitlements.map(EntitlementTransformer.toGraphQL),
      })),
    })
    return results.map(ExternalUserEntitlementsResultTransformer.toClient)
  }

  async getEntitlementsSequence(
    name: string,
  ): Promise<EntitlementsSequence | undefined> {
    const entitlementsSequence =
      await this.adminApiClient.getEntitlementsSequence({
        name,
      })
    if (!entitlementsSequence) {
      return undefined
    }
    return EntitlementsSequenceTransformer.toClient(entitlementsSequence)
  }

  async listEntitlementsSequences(
    nextToken?: string,
  ): Promise<EntitlementsSequencesConnection> {
    const entitlementsSequencesConnection =
      await this.adminApiClient.listEntitlementsSequences(nextToken)
    return EntitlementsSequencesConnectionTransformer.toClient(
      entitlementsSequencesConnection,
    )
  }

  async addEntitlementsSequence(
    newEntitlementsSequence: Omit<
      EntitlementsSequence,
      'createdAt' | 'updatedAt' | 'version'
    >,
  ): Promise<EntitlementsSequence> {
    const input: AddEntitlementsSequenceInput = {
      name: newEntitlementsSequence.name,
      description: newEntitlementsSequence.description,
      transitions: newEntitlementsSequence.transitions.map(
        EntitlementsSequenceTransitionTransformer.toGraphQL,
      ),
    }
    const entitlementsSequence =
      await this.adminApiClient.addEntitlementsSequence(input)
    return EntitlementsSequenceTransformer.toClient(entitlementsSequence)
  }

  async setEntitlementsSequence(
    newEntitlementsSequence: Omit<
      EntitlementsSequence,
      'createdAt' | 'updatedAt' | 'version'
    >,
  ): Promise<EntitlementsSequence> {
    const input: SetEntitlementsSequenceInput = {
      name: newEntitlementsSequence.name,
      description: newEntitlementsSequence.description,
      transitions: newEntitlementsSequence.transitions.map(
        EntitlementsSequenceTransitionTransformer.toGraphQL,
      ),
    }
    const entitlementsSequence =
      await this.adminApiClient.setEntitlementsSequence(input)
    return EntitlementsSequenceTransformer.toClient(entitlementsSequence)
  }

  async removeEntitlementsSequence(
    name: string,
  ): Promise<EntitlementsSequence | undefined> {
    const removed = await this.adminApiClient.removeEntitlementsSequence({
      name,
    })
    if (!removed) {
      return undefined
    }
    return EntitlementsSequenceTransformer.toClient(removed)
  }

  async applyEntitlementsSequenceToUser(
    externalId: string,
    entitlementsSequenceName: string,
    transitionsRelativeTo?: Date,
  ): Promise<ExternalUserEntitlements> {
    const userEntitlements =
      await this.adminApiClient.applyEntitlementsSequenceToUser({
        externalId,
        entitlementsSequenceName,
        transitionsRelativeToEpochMs: transitionsRelativeTo?.getTime(),
      })
    return ExternalUserEntitlementsTransformer.toClient(userEntitlements)
  }

  async applyEntitlementsSequenceToUsers(
    operations: {
      externalId: string
      entitlementsSequenceName: string
      transitionsRelativeTo?: Date
    }[],
  ): Promise<ExternalUserEntitlementsResult[]> {
    const results = await this.adminApiClient.applyEntitlementsSequenceToUsers({
      operations: operations.map((o) => ({
        externalId: o.externalId,
        entitlementsSequenceName: o.entitlementsSequenceName,
        transitionsRelativeToEpochMs: o.transitionsRelativeTo?.getTime(),
      })),
    })
    return results.map(ExternalUserEntitlementsResultTransformer.toClient)
  }

  async removeEntitledUser(
    externalId: string,
  ): Promise<EntitledUser | undefined> {
    const removed = await this.adminApiClient.removeEntitledUser({
      externalId,
    })
    if (!removed) {
      return undefined
    }
    return { externalId: removed.externalId }
  }
}
