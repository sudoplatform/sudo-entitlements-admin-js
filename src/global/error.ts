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
