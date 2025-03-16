export interface Range {
  start: number
  end: number
}

export interface RangePolicy {
  computeRanges(contentLength: number): Range[]
}

export function isRangePolicy(rangeOptions?: RangePolicy | DefaultRangePolicyOptions): rangeOptions is RangePolicy {
  if (!rangeOptions) { return false }
  return 'computeRanges' in rangeOptions && typeof rangeOptions.computeRanges === 'function'
}

export function resolveRangePolicy(rangeOptions?: RangePolicy | DefaultRangePolicyOptions) {
  if (isRangePolicy(rangeOptions)) {
    return rangeOptions
  }
  return new DefaultRangePolicy(rangeOptions?.rangeThreshold ?? 1024 * 1024, 4)
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
    readonly concurrency: number
  ) { }

  getConcurrency() {
    return this.concurrency
  }

  computeRanges(total: number): Range[] {
    const { rangeThreshold: minChunkSize } = this
    if (total <= minChunkSize) {
      return [{ start: 0, end: total }]
    }
    const partSize = Math.max(minChunkSize, Math.floor(total / this.getConcurrency()))
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
