import { ResourceMetadata } from "./metadata";
import { Segment } from "./segment";

export type DownloadFailedReason = "DownloadAborted" | "DownloadValidationFailed" | "GeneralDownloadException" | NetworkErrorType

/**
 * Download
 */
export class DownloadError extends Error {
    constructor(
        readonly error: DownloadFailedReason,
        readonly metadata: ResourceMetadata | undefined,
        readonly headers: Record<string, any>,
        readonly destination: string,
        readonly segments: Segment[],
        readonly segmentErrors: any[]
    ) {
        super(`The download failed! ${error}`);
    }
}

export type NetworkErrorType = "ConnectionReset" | "ConnectionTimeout" | "OperationCancelled" | "ProtocolError"

export function resolveNetworkErrorType(e: any): NetworkErrorType | undefined {
    if (e.code === "ECONNRESET") { return "ConnectionReset"; }
    if (e.code === "ETIMEDOUT") { return "ConnectionTimeout"; }
    if (e.code === "EPROTO") { return "ProtocolError"; }
    if (e.code === "ECANCELED") { return "OperationCancelled"; }
}

/**
 * A simple util function to determine if this is a common network condition error.
 * @param e Error object
 */
export function isCommonNetworkError(e: any) {
    if (typeof e.code === "string") {
        return e.code === "ECONNRESET"
            || e.code === "ETIMEDOUT"
            || e.code === "EPROTO"
            || e.code === "ECANCELED";
    }
    return false
}
