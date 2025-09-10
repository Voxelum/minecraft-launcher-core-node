import EventEmitter from 'events'
import { Kysely } from 'kysely'
import { ParseResourceArgs, ParseResourceResult } from '../parsers'
import { ResourceActionDispatcher } from './ResourceActionDispatcher'
import { Logger } from './logger'
import { Database } from './schema'

export interface ResourceContext {
  readonly db: Kysely<Database>

  readonly root: string

  readonly logger: Logger

  ExpectedError: { new(...args: any[]): Error }

  UnexpectedError: { new(name: string, message: string): Error }

  hashAndFileType(file: string, size: number, isDir?: boolean): Promise<[string, string]>

  parse(resource: ParseResourceArgs): Promise<ParseResourceResult>

  cacheImage(buf: Uint8Array): Promise<string>

  dispatch: ResourceActionDispatcher

  eventBus: EventEmitter

  onError(e: Error): void
  onException(): void
}