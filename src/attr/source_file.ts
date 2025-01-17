import type { Pool, UTF8Entry } from "../pool";
import { create, wrap } from "../buffer";
import type { Attribute } from "./";
import { AttributeType } from "../spec";

export interface SourceFileAttribute extends Attribute {
    type: AttributeType.SOURCE_FILE;
    sourceFileIndex: number; // UTF8Entry index

    sourceFileEntry?: UTF8Entry;
}

export const readSourceFile = (attr: Attribute, pool: Pool): SourceFileAttribute => {
    const buffer = wrap(attr.data);

    const sourceFileIndex = buffer.getUint16();
    return {
        ...attr,
        type: AttributeType.SOURCE_FILE,
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
