import { createHash } from 'crypto'
import { readFile, createReadStream } from 'fs'
import { promisify } from 'util'
import { pipeline } from 'stream/promises'

export interface Validator {
  /**
     * Validate the download result. It should throw `ValidationError` if validation failed.
     *
     * @param destination The result file
     * @param url The url where the file downloaded from
     */
  validate(destination: string, url: string): Promise<void>
}

export class ChecksumValidator implements Validator {
  constructor(protected checksum?: ChecksumValidatorOptions) { }

  async validate(destination: string, url: string): Promise<void> {
    if (this.checksum) {
      const checksum = this.checksum
      const hash = createHash(checksum.algorithm)
      await pipeline(createReadStream(destination), hash).catch((e) => {
        if (e.code === 'ENOENT') {
          throw new ChecksumNotMatchError(checksum.algorithm, checksum.hash, '', destination, url)
        }
        throw e
      })
      const actual = hash.digest('hex')
      const expect = checksum.hash
      if (actual !== expect) {
        throw new ChecksumNotMatchError(checksum.algorithm, checksum.hash, actual, destination, url)
      }
    }
  }
}

export function isValidator(options?: Validator | ChecksumValidatorOptions): options is Validator {
  if (!options) { return false }
  return 'validate' in options && typeof options.validate === 'function'
}

export function resolveValidator(options?: ChecksumValidatorOptions | Validator): Validator | undefined {
  if (isValidator(options)) { return options }
  if (options) {
    return new ChecksumValidator({ hash: options.hash, algorithm: options.algorithm })
  }
  return undefined
}

export interface ChecksumValidatorOptions {
  algorithm: string
  hash: string
}

export class JsonValidator implements Validator {
  async validate(destination: string, url: string): Promise<void> {
    const content = await promisify(readFile)(destination, 'utf-8')
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
