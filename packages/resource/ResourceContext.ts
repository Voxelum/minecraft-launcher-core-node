import EventEmitter from 'events'
import { Kysely } from 'kysely'
import { ResourcesState } from './ResourcesState'
import { WorkerQueueFactory } from './core/watchResourcesDirectory'
import { ParseResourceArgs, ParseResourceResult } from './parsers'
import { Database } from './schema'

export interface ResourceContext {
  readonly db: Kysely<Database>

  readonly root: string

  ExpectedError: { new(...args: any[]): Error }

  UnexpectedError: { new(name: string, message: string): Error }

  hashAndFileType(file: string, size: number, isDir?: boolean): Promise<[string, string]>

  parse(resource: ParseResourceArgs): Promise<ParseResourceResult>

  cacheImage(buf: Uint8Array): Promise<string>

  createWorkerQueue: WorkerQueueFactory

  createResourceState(): ResourcesState

  event: EventEmitter

  onError(e: Error): void

  onException(): void
}