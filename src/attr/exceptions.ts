import { create, wrap } from "../buffer";
import type { ClassEntry, Pool } from "../pool";
import { AttributeType } from "../spec";
import type { Attribute } from "./";

export interface ExceptionEntry {
    index: number;
    entry?: ClassEntry;
}

export interface ExceptionsAttribute extends Attribute {
    type: AttributeType.EXCEPTIONS;

    entries: ExceptionEntry[];
}

export const readExceptions = (attr: Attribute, pool: Pool): ExceptionsAttribute => {
    const buffer = wrap(attr.data);

    const numExceptions = buffer.getUint16();
    const entries = new Array<ExceptionEntry>(numExceptions);
    for (let i = 0; i < numExceptions; i++) {
        const index = buffer.getUint16();

        entries[i] = { index, entry: pool[index] as ClassEntry | undefined };
    }

    return { ...attr, type: AttributeType.EXCEPTIONS, entries };
};

export const writeExceptions = (attr: ExceptionsAttribute): Uint8Array => {
    const buffer = create((attr.entries.length + 1) * 2);

    buffer.setUint16(attr.entries.length);
    for (const exc of attr.entries) {
        if (exc.entry) {
            exc.index = exc.entry.index;
        }

        buffer.setUint16(exc.index);
    }

    return buffer.arrayView;
};
