import type { RangeRunningWatch } from './download'

export interface Range {
  start: number
  end: number
}

export interface RangePolicy {
  computeRanges(contentLength: number): Range[]

  shouldDivide(watch: RangeRunningWatch): boolean

  divideRange(position: number, end: number): number | undefined
}

export function isRangePolicy(
  rangeOptions?: RangePolicy | DefaultRangePolicyOptions,
): rangeOptions is RangePolicy {
  if (!rangeOptions) {
    return false
  }
  return 'computeRanges' in rangeOptions && typeof rangeOptions.computeRanges === 'function'
}

export function resolveRangePolicy(rangeOptions?: RangePolicy | DefaultRangePolicyOptions) {
  if (isRangePolicy(rangeOptions)) {
    return rangeOptions
  }
  return new DefaultRangePolicy(
    rangeOptions?.rangeThreshold ?? 1024 * 1024,
    4,
    1024 * 10,
    1024 * 1024,
  )
}

export interface DefaultRangePolicyOptions {
  /**
   * The minimum bytes a range should have.
   * @default 2MB
   */
  rangeThreshold?: number
}

export class DefaultRangePolicy implements RangePolicy {
  constructor(
    readonly rangeThreshold: number,
    readonly concurrency: number,
    readonly minSpeedThreshold: number,
    readonly minDivideSize: number,
  ) {}

  shouldDivide(watch: RangeRunningWatch): boolean {
    return watch.avgSpeed < this.minSpeedThreshold
  }

  divideRange(position: number, end: number): number | undefined {
    const remaining = end - position + 1
    if (remaining > this.minDivideSize * 2) {
      return Math.floor((end - position) / 2) + position
    }
    return undefined
  }

  computeRanges(total: number): Range[] {
    const { rangeThreshold: minChunkSize } = this
    if (total <= minChunkSize) {
      return [{ start: 0, end: total }]
    }
    const partSize = Math.max(minChunkSize, Math.floor(total / this.concurrency))
    const ranges: Range[] = []
    for (let cur = 0, chunkSize = 0; cur < total; cur += chunkSize) {
      const remain = total - cur
      if (remain >= partSize) {
        chunkSize = partSize
        ranges.push({ start: cur, end: cur + chunkSize - 1 })
      } else {
        const last = ranges[ranges.length - 1]
        if (!last) {
          ranges.push({ start: 0, end: remain - 1 })
        } else {
          last.end = last.end + remain
        }
        cur = total
      }
    }
    return ranges
  }
}
