export interface Segment {
  start: number
  end: number
}

export interface SegmentPolicy {
  computeSegments(contentLength: number): Segment[]
}

export function isSegmentPolicy(segmentOptions?: SegmentPolicy | DefaultSegmentPolicyOptions): segmentOptions is SegmentPolicy {
  if (!segmentOptions) { return false }
  return 'computeSegments' in segmentOptions && typeof segmentOptions.computeSegments === 'function'
}

export function resolveSegmentPolicy(segmentOptions?: SegmentPolicy | DefaultSegmentPolicyOptions) {
  if (isSegmentPolicy(segmentOptions)) {
    return segmentOptions
  }
  return new DefaultSegmentPolicy(segmentOptions?.segmentThreshold ?? 2 * 1024 * 1024, 4)
}

export interface DefaultSegmentPolicyOptions {
  /**
     * The minimum bytes a segment should have.
     * @default 2MB
     */
  segmentThreshold?: number
}

export class DefaultSegmentPolicy implements SegmentPolicy {
  constructor(readonly segmentThreshold: number, readonly concurrency: number) { }

  computeSegments(total: number): Segment[] {
    const { segmentThreshold: chunkSize, concurrency } = this
    if (total <= chunkSize) {
      return [{ start: 0, end: total }]
    }
    const partSize = Math.max(chunkSize, Math.floor(total / concurrency))
    const segments: Segment[] = []
    for (let cur = 0, chunkSize = 0; cur < total; cur += chunkSize) {
      const remain = total - cur
      if (remain >= partSize) {
        chunkSize = partSize
        segments.push({ start: cur, end: cur + chunkSize - 1 })
      } else {
        const last = segments[segments.length - 1]
        if (!last) {
          segments.push({ start: 0, end: remain - 1 })
        } else {
          last.end = last.end + remain
        }
        cur = total
      }
    }
    return segments
  }
}
