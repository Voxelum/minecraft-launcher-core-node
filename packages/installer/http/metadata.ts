export function parseRangeInfo(headers: Record<string, any>) {
    const contentLength = headers['content-length'] ? Number.parseInt(headers['content-length']) : -1
    const isAcceptRanges = headers['accept-ranges'] === 'bytes'
    return {
        contentLength,
        isAcceptRanges,
    }
}
