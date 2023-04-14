import { createHash } from 'crypto'
import { createReadStream } from 'fs'
import { FileHandle } from 'fs/promises'
import { pipeline } from 'stream/promises'

export interface Validator {
  /**
     * Validate the download result. It should throw `ValidationError` if validation failed.
     *
     * @param fd The file desciprtor
     * @param destination The result file
     * @param url The url where the file downloaded from
     */
  validate(fd: FileHandle, destination: string, url: string): Promise<void>
}

export class ChecksumValidator implements Validator {
  constructor(protected checksum?: ChecksumValidatorOptions) { }

  async validate(fd: FileHandle, destination: string, url: string): Promise<void> {
    if (this.checksum) {
      const hash = createHash(this.checksum.algorithm)
      await pipeline(createReadStream(destination), hash)
      const actual = hash.digest('hex')
      const expect = this.checksum.hash
      if (actual !== expect) {
        throw new ChecksumNotMatchError(this.checksum.algorithm, this.checksum.hash, actual, destination, url)
      }
    }
  }
}

export function isValidator(options?: Validator | ChecksumValidatorOptions): options is Validator {
  if (!options) { return false }
  return 'validate' in options && typeof options.validate === 'function'
}

export function resolveValidator(options?: ChecksumValidatorOptions | Validator): Validator {
  if (isValidator(options)) { return options }
  if (options) {
    return new ChecksumValidator({ hash: options.hash, algorithm: options.algorithm })
  }
  return { validate() { return Promise.resolve() } }
}

export interface ChecksumValidatorOptions {
  algorithm: string
  hash: string
}

export class JsonValidator implements Validator {
  async validate(fd: FileHandle, destination: string, url: string): Promise<void> {
    const content = await fd.readFile('utf-8')
    JSON.parse(content)
  }
}

export class ValidationError extends Error {
  constructor(error: string, message?: string) {
    super(message)
    this.name = error
  }
}

export class ChecksumNotMatchError extends ValidationError {
  constructor(readonly algorithm: string, readonly expect: string, readonly actual: string, readonly file: string, readonly source?: string) {
    super('ChecksumNotMatchError', source ? `File ${file} (${source}) ${algorithm} checksum not match. Expect: ${expect}. Actual: ${actual}.` : `File ${file} ${algorithm} checksum not match. Expect: ${expect}. Actual: ${actual}.`)
  }
}
