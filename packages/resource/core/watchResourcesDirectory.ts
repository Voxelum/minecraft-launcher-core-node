import { FSWatcher } from 'chokidar'
import { basename, join, resolve, sep } from 'path'
import { Resource } from '../Resource'
import { ResourceDomain } from '../ResourceDomain'
import { ResourceMetadata } from '../ResourceMetadata'
import { File } from '../File'
import { ResourceContext } from '../ResourceContext'
import { ResourceWorkerQueuePayload } from '../ResourceWorkerQueuePayload'
import { getFile, getFiles } from './getFile'
import { generateResourceV3, pickMetadata } from './generateResource'
import { getOrParseMetadata } from './getOrParseMetadata'
import { ResourceSnapshotTable } from '../schema'
import { shouldIgnoreFile } from './shouldIgnoreFile'
import { getDomainedPath, isSnapshotValid, takeSnapshot } from './takeSnapshot'
import { jsonArrayFrom } from './sqlHelper'
import { ResourceAction, ResourcesState, UpdateResourcePayload } from '../ResourcesState'

function createRevalidateFunction(
  dir: string,
  context: ResourceContext,
  onResourceRemove: (path: string) => void,
  onResourceQueue: (job: ResourceWorkerQueuePayload) => void,
  onResourceEmit: ResouceEmitFunc,
  onResourcePostRevalidate: (files: File[]) => void,
) {
  async function getUpserts() {
    const entries = await getFiles(dir).catch((e) => {
      if (e.code === 'ENOENT') {
        return []
      }
      throw e
    })
    const inos = entries.map(e => e.ino)
    const records: Record<string, ResourceSnapshotTable> = await context.db.selectFrom('snapshots')
      .selectAll()
      .where((eb) => eb.or([
        eb('domainedPath', 'like', `${dir}%`),
        eb('ino', 'in', inos),
      ]))
      .execute()
      .then((all) => Object.fromEntries(all.map((r) => [r.domainedPath, r] as const)), () => ({}))
    const inoMap = Object.fromEntries(Object.values(records).map((e) => [e.ino, e] as const))

    const result = entries.map((file) => {
      const domainedPath = getDomainedPath(file.path, context.root)
      const record = records[domainedPath] || inoMap[file.ino]

      delete records[domainedPath]
      if (!record || record.mtime < file.mtime) {
        return [file, undefined] as const
      }

      return [file, {
        ...record,
        mtime: file.mtime,
        domainedPath,
      }] as const
    })

    for (const r of Object.values(records)) {
      // to remove the record that is not in the file system
      onResourceRemove(join(context.root, r.domainedPath))
    }

    return result
  }

  async function revalidate() {
    const results = await getUpserts()

    const hits = results.map((jobs) => {
      if (!jobs[1]) {
        onResourceQueue({ filePath: jobs[0].path, file: jobs[0] })
        return undefined
      }
      return jobs
    }).filter((v): v is [File, ResourceSnapshotTable] => !!v)

    const resources = await context.db.selectFrom('resources')
      .selectAll()
      .select((eb) => [
        jsonArrayFrom(
          eb.selectFrom('icons').select(['icons.icon', 'icons.sha1']).whereRef('icons.sha1', '=', 'resources.sha1'),
        ).as('icons'),
      ])
      .where('sha1', 'in', hits.map(h => h[1].sha1))
      .execute().then((all) => Object.fromEntries(all.map(a => [a.sha1, a])))

    for (const [file, record] of hits) {
      const resource = resources[record.sha1]
      if (!resource) {
        onResourceQueue({ filePath: file.path, file, record })
        continue
      }
      if (basename(dir) === 'mods' && !resource.fabric && !resource.forge && !resource.quilt && !resource.neoforge && !file.isDirectory) {
        onResourceQueue({ filePath: file.path, file, record, metadata: resource })
        continue
      }
      onResourceEmit(file, record, { ...pickMetadata(resource), icons: resource.icons.map(i => i.icon) })
    }

    onResourcePostRevalidate(results.map(([f]) => f))
  }

  return revalidate
}

function createWorkerQueue(
  context: ResourceContext,
  domain: ResourceDomain,
  intercept: (func: () => Promise<void>) => Promise<void>,
  onResourceEmit: ResouceEmitFunc,
  queueFactory: WorkerQueueFactory,
  parse: boolean,
) {
  const workerQueue = queueFactory(async (job) => intercept(async () => {
    if (!job.file) {
      job.file = await getFile(job.filePath)
      if (!job.file) {
        throw new context.UnexpectedError('ResourceFileNotFoundError', `Resource file ${job.filePath} not found`)
      }
    }

    if (job.record) {
      if (!isSnapshotValid(job.file, job.record)) {
        job.record = await takeSnapshot(job.file, context, parse)
      }
    }

    if (!job.record) {
      job.record = await takeSnapshot(job.file, context, parse)
    }

    const metadata = await getOrParseMetadata(job.file, job.record, domain, context, job, parse)

    if (parse && metadata) {
      context.event.emit('resourceParsed', job.record.sha1, domain, metadata)
    }

    onResourceEmit(job.file, job.record, metadata ?? {})
  }))
  return workerQueue
}

function createWatcher(
  path: string,
  onResourceUpdate: (file: File) => void,
  onResourceRemove: (file: string) => void,
  revalidate: () => void,
) {
  const watcher = new FSWatcher({
    cwd: path,
    depth: 1,
    followSymlinks: true,
    alwaysStat: true,
    ignorePermissionErrors: true,
    ignoreInitial: true,
    ignored: (filePath) => {
      if (resolve(filePath) === path) return false
      return shouldIgnoreFile(filePath)
    },
  }).on('all', async (event, file, stat) => {
    if (!file) return

    const depth = file.split(sep).length
    if (depth > 1) return

    if (shouldIgnoreFile(file)) return
    if (file.endsWith('.txt')) return
    if (event === 'unlink') {
      onResourceRemove(join(path, file))
    } else if (event === 'add' || event === 'change') {
      if (!stat) {
        return
      }
      const fileObj: File = {
        path: join(path, file),
        fileName: basename(file),
        size: stat.size,
        mtime: stat.mtimeMs,
        atime: stat.atimeMs,
        ctime: stat.ctimeMs,
        ino: stat.ino,
        isDirectory: stat.isDirectory(),
      }
      onResourceUpdate(fileObj)
    } else if (event === 'unlinkDir' && file === path) {
      revalidate()
    }
  })

  watcher.add(path)

  return watcher
}

type ResouceEmitFunc = (file: File, record: ResourceSnapshotTable, metadata: ResourceMetadata & { icons?: string[] }) => void

export interface WorkerQueue<T> {
  push(value: T): void
  dispose(): void
  onerror(job: T, e: Error): void
}

export interface WorkerQueueFactory {
  (handler: (value: ResourceWorkerQueuePayload) => Promise<void>): WorkerQueue<ResourceWorkerQueuePayload>
}

export interface WatchResourceDirectoryOptions {
  directory: string
  domain: ResourceDomain
  context: ResourceContext
  processUpdate: (func: () => Promise<void>) => Promise<void>
  onDispose: () => void
}

export function watchResourcesDirectory(
  {
    directory,
    domain,
    context,
    processUpdate,
    onDispose,
  }: WatchResourceDirectoryOptions
) {
  let disposed = false
  const state = context.createResourceState()

  const onRemove = (file: string) => {
    if (disposed) return
    const fileRelativeName = getDomainedPath(file, context.root)
    context.db.deleteFrom('snapshots')
      .where('domainedPath', '=', fileRelativeName)
      .execute()
      .catch((e) => { })

    state.push(ResourceAction.Remove, file)
  }

  const onResourceEmit: ResouceEmitFunc = (file, record, metadata) => {
    const resource = generateResourceV3(file, record, metadata)
    if (!resource.path) {
      context.onError(new context.UnexpectedError('ResourcePathError', 'Resource path is not available'))
      return
    }
    state.push(ResourceAction.Upsert, resource)
  }

  const onResourceQueue = (job: ResourceWorkerQueuePayload) => {
    if (disposed) return
    workerQueue.push(job)
  }

  const onResourcePostRevalidate = (files: File[]) => {
    const all = Object.fromEntries(files.map(f => [f.path, f]))
    for (const file of state.files) {
      if (!all[file.path]) {
        state.push(ResourceAction.Remove, file.path)
      }
    }
  }

  const workerQueue = createWorkerQueue(context, domain, processUpdate, onResourceEmit, context.createWorkerQueue, true)
  const revalidate = createRevalidateFunction(directory, context, onRemove,
    onResourceQueue, onResourceEmit, onResourcePostRevalidate)

  const watcher = createWatcher(directory, async (file) => {
    if (disposed) return
    const record = await context.db.selectFrom('snapshots')
      .selectAll()
      .where((eb) => eb.or([
        eb('domainedPath', '=', getDomainedPath(file.path, context.root)),
        eb('ino', '=', file.ino),
      ]))
      .executeTakeFirst()

    workerQueue.push({ filePath: file.path, file, record })
  }, onRemove, revalidate)

  workerQueue.onerror = ({ filePath }, e) => {
    if (disposed) return
    if ((e as any)?.code && ['EBUSY', 'ENOENT'].includes((e as any).code)) {
      // ignore the busy file
      return
    }
    if (!(e instanceof Error)) {
      e = Object.assign(new Error(), e)
    }
    context.onError(e)
  }

  const onResourceUpdate = (res: UpdateResourcePayload[]) => {
    state.push(ResourceAction.BatchUpdate, res)
  }

  context.event.on('resourceUpdate', onResourceUpdate)
  function dispose() {
    disposed = true
    onDispose()
    watcher.close()
    workerQueue.dispose()
    context.event.off('resourceUpdate', onResourceUpdate)
  }

  revalidate()

  function enqueue(job: ResourceWorkerQueuePayload) {
    if (!job.filePath.startsWith(directory)) {
      context.onError(new context.UnexpectedError('ResourceEnqueueError', `Resource ${job.filePath} is not in the directory ${directory}`))
      return
    }
    workerQueue.push(job)
  }

  return {
    enqueue,
    dispose,
    revalidate,
    state,
  }
}
