import type { Pool, UTF8Entry } from "../pool";
import { type ByteBuffer, type MutableByteBuffer } from "../buffer";
import { AttributeType } from "../spec";
import { type CodeAttribute, type ExceptionTableEntry, readCode, writeCode } from "./code";
import type { DirtyMarkable } from "../";

export interface Attribute extends DirtyMarkable {
    nameIndex: number;
    data: Uint8Array;

    // not present if index is invalid
    name?: string; // arbitrary name or built-ins from AttributeType
    nameEntry?: UTF8Entry;
}

export interface Attributable {
    attrs: Attribute[];
}

const readSingle = (buffer: ByteBuffer, pool: Pool): Attribute => {
    const nameIndex = buffer.readUnsignedShort();
    const nameEntry = pool[nameIndex] as UTF8Entry | undefined;

    const data = buffer.read(buffer.readInt());

    let attr: Attribute = {
        dirty: false,
        nameIndex,
        data,
        name: nameEntry?.decode(),
        nameEntry,
    };
    switch (attr.name) {
        case AttributeType.CODE: {
            attr = readCode(attr, pool);
            break;
        }
    }

    return attr;
};

export const readAttrs = (buffer: ByteBuffer, pool: Pool): Attribute[] => {
    const attributesCount = buffer.readUnsignedShort();

    const attributes = new Array<Attribute>(attributesCount);
    for (let i = 0; i < attributesCount; i++) {
        attributes[i] = readSingle(buffer, pool);
    }

    return attributes;
};

const writeSingle = (buffer: MutableByteBuffer, attr: Attribute) => {
    if (attr.dirty) {
        // rebuild data if dirty
        if (attr.nameEntry) {
            attr.nameIndex = attr.nameEntry.index;
            attr.name = attr.nameEntry.decode();

            switch (attr.name) {
                case AttributeType.CODE: {
                    attr.data = writeCode(attr as CodeAttribute);
                    break;
                }
            }
        }

        attr.dirty = false;
    }

    buffer.writeUnsignedShort(attr.nameIndex);
    buffer.writeInt(attr.data.length);
    buffer.write(attr.data);
};

export const writeAttrs = (buffer: MutableByteBuffer, attrs: Attribute[]) => {
    buffer.writeUnsignedShort(attrs.length);
    for (const attr of attrs) {
        writeSingle(buffer, attr);
    }
};

export { CodeAttribute, ExceptionTableEntry };
