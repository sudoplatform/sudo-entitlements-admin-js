/**
 * An unexpected error was encountered. This may result from programmatic error
 * and is unlikely to be user recoverable.
 */
export class FatalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FatalError'
  }
}

/**
 * Indicates that the input entitlements name was not recognized.
 */
export class InvalidEntitlementsError extends Error {
  constructor() {
    super('Specified entitlement name is invalid.')
    this.name = 'InvalidEntitlementsError'
  }
}

/**
 * Indicates that an attempt has been made to delete an entitlements set that is currently in use by one or
 * more entitlements sequences.
 */
export class EntitlementsSetInUseError extends Error {
  constructor() {
    super('Specified entitlements set is in use.')
    this.name = 'EntitlementsSetInUseError'
  }
}

/**
 * Indicates that the input entitlements set name does not exist when applying an entitlements set to a user.
 */
export class EntitlementsSetNotFoundError extends Error {
  constructor() {
    super('Specified entitlements set does not exist.')
    this.name = 'EntitlementsSetNotFoundError'
  }
}

/**
 * Indicates that the attempt to add a new entitlement set failed because an entitlements set with the same
 * name already exists.
 */
export class EntitlementsSetAlreadyExistsError extends Error {
  constructor() {
    super('Specified entitlements set already exists.')
    this.name = 'EntitlementsSetAlreadyExistsError'
  }
}

/**
 * Indicates that the attempt to add a new entitlement sequence failed because an entitlements sequence
 * with the same name already exists.
 */
export class EntitlementsSequenceAlreadyExistsError extends Error {
  constructor() {
    super('Specified entitlements sequence already exists.')
    this.name = 'EntitlementsSequenceAlreadyExistsError'
  }
}

/**
 * Indicates that the input entitlements sequence name does not exists when applying an entitlements sequence
 * to a user.
 */
export class EntitlementsSequenceNotFoundError extends Error {
  constructor() {
    super('Specified entitlements sequence does not exist.')
    this.name = 'EntitlementsSequenceNotFoundError'
  }
}

/**
 * Returned if an entitlements sequence update is already in progress
 * when setEntitlementsSequence or removeEntitlementsSequence is attempted.
 */
export class EntitlementsSequenceUpdateInProgressError extends Error {
  constructor() {
    super('Specified entitlements sequence update is not yet complete.')
    this.name = 'EntitlementsSequenceUpdateInProgressError'
  }
}

/**
 * A bulk operations has specified multiple operations for the same user
 */
export class BulkOperationDuplicateUsersError extends Error {
  constructor() {
    super('Duplicate users specified in bulk apply operation.')
    this.name = 'BulkOperationDuplicateUsersError'
  }
}

/**
 * Returned if an attempt to update a user's entitlements is made after the
 * user's entitlements have already been updated to a later version
 */
export class AlreadyUpdatedError extends Error {
  constructor() {
    super('User entitlements already updated.')
    this.name = 'AlreadyUpdatedError'
  }
}

/**
 * Returned if the named EntitlementsSet is not modifiable or removable
 */
export class EntitlementsSetImmutableError extends Error {
  constructor() {
    super('Specified entitlements set is immutable.')
    this.name = 'EntitlementsSetImmutableError'
  }
}

/**
 * Thrown if an operation invalidly specifies the same entitlement
 * multiple times.
 */
export class DuplicateEntitlementError extends Error {
  constructor() {
    super('Entitlements may only be specified once in the operation')
    this.name = 'DuplicateEntitlementError'
  }
}

/**
 * Returned if an applyExpendableEntitlementsToUser operation would
 * result in negative expendable entitlements for the user
 */
export class NegativeEntitlementError extends Error {
  constructor() {
    super('Operation would result in negative entitlement')
    this.name = 'NegativeEntitlementError'
  }
}

/**
 * Returned if an applyExpendableEntitlementsToUser operation would
 * result in an overflowed expendable entitlements for the user
 */
export class OverflowedEntitlementError extends Error {
  constructor() {
    super('Operation would result in overflowed entitlement')
    this.name = 'OverflowedEntitlementError'
  }
}
