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
export class EntitlementsSetInUse extends Error {
  constructor() {
    super('Specified entitlements set is in use.')
    this.name = 'EntitlementsSetInUse'
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
 * Indicates that an attempt was made to modify or delete an immutable entitlements set was made (e.g. _unentitled_).
 */
export class EntitlementsSetImmutableError extends Error {
  constructor() {
    super('Specified entitlements set is immutable.')
    this.name = 'EntitlementsSetImmutableError'
  }
}
