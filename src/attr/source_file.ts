import type { Pool, UTF8Entry } from "../pool";
import { create, wrap } from "../buffer";
import type { Attribute } from "./";

export interface SourceFileAttribute extends Attribute {
    sourceFileIndex: number; // UTF8Entry index

    sourceFileEntry?: UTF8Entry;
}

export const readSourceFile = (attr: Attribute, pool: Pool): SourceFileAttribute => {
    const buffer = wrap(attr.data);

    const sourceFileIndex = buffer.getUint16();
    return {
        ...attr,
        sourceFileIndex,
        sourceFileEntry: pool[sourceFileIndex] as UTF8Entry | undefined,
    };
};

export const writeSourceFile = (attr: SourceFileAttribute): Uint8Array => {
    if (attr.sourceFileEntry) {
        attr.sourceFileIndex = attr.sourceFileEntry.index;
    }

    const buffer = create(2);
    buffer.setUint16(attr.sourceFileIndex);

    return buffer.arrayView;
};
