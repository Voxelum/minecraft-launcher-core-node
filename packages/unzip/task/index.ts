import { extract, OpenTarget, ExtractOptions, EntryHandler } from "../index";
import { Task } from "@xmcl/task";
import { Entry } from "yauzl";

/**
 * This might be released as a seperate package, or removed later since this is a reversed dependency
 * @internal
 */
export function extractTaskFunction(openFile: OpenTarget, dest: string, options: ExtractOptions = {}): Task.Function<void> {
    return async (c) => {
        let extracted = 0;
        let total = 0;
        let handler = options.entryHandler || ((d: string, e: Entry) => e.fileName);
        let before: EntryHandler = (destinationRoot: string, entry: Entry) => {
            let result = handler(destinationRoot, entry);
            if (result instanceof Promise) {
                result.then((p) => p ? c.update(extracted, total += 1) : void 0, () => { });
            } else {
                c.update(extracted, total += 1);
            }
            return result;
        };
        let after = (destination: string, entry: Entry) => {
            options.onAfterExtracted?.(destination, entry);
            c.update(extracted += 1, total);
        };
        await extract(openFile, dest, { ...options, entryHandler: before, onAfterExtracted: after });
    };
}
