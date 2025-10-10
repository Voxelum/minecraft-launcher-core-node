export interface ProgressTracker {
  url: string;
  total: number;
  acceptRanges: boolean;
  progress: number;
  speed: number;
}

export class ProgressTrackerMultiple implements ProgressTracker {
  trackers: ProgressTracker[] = [];

  subSingle(): ProgressTrackerSingle {
    const single = new ProgressTrackerSingle()
    this.trackers.push(single)
    return single
  }

  subMultiple(): ProgressTrackerMultiple {
    const multiple = new ProgressTrackerMultiple()
    this.trackers.push(multiple)
    return multiple
  }

  get url() {
    return this.trackers.map(t => t.url).join(', ');
  }

  get total() {
    return this.trackers.reduce((a, b) => a + b.total, 0);
  }

  get acceptRanges() {
    return this.trackers.every(t => t.acceptRanges);
  }

  get progress() {
    return this.trackers.reduce((a, b) => a + b.progress, 0);
  }

  get speed() {
    return this.trackers.reduce((a, b) => a + b.speed, 0);
  }
}

/**
 * Track progress of a download
 */
export class ProgressTrackerSingle implements ProgressTracker {
  accessor?: ProgressTracker

  constructor(readonly onDownload?: (accessor: ProgressTracker) => void) {}

  setAccessor(accessor: ProgressTracker) {
    this.accessor = accessor
    try {
      this.onDownload?.(accessor)
    } catch (e) {
      // Prevent callback errors from breaking the download
      console.error('Error in progress callback:', e)
    }
  }

  get progress() {
    return this.accessor?.progress ?? 0
  }

  get speed() {
    return this.accessor?.speed ?? 0
  }

  get total() {
    return this.accessor?.total ?? 0
  }

  get url() {
    return this.accessor?.url ?? ''
  }

  get acceptRanges() {
    return this.accessor?.acceptRanges ?? false
  }
}
