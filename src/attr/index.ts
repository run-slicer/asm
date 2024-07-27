import type { Pool, UTF8Entry } from "../pool";
import { type ByteBuffer, type MutableByteBuffer } from "../buffer";
import { AttributeType } from "../spec";
import { type CodeAttribute, type ExceptionTableEntry, readCode, writeCode } from "./code";
import type { DirtyMarkable } from "../";

export interface Attribute extends DirtyMarkable {
    name: string; // built-ins => AttributeType
    nameEntry: UTF8Entry;
    data: Uint8Array;
}

export interface Attributable {
    attributes: Attribute[];

    attribute<T extends Attribute>(type: string): T | null;
}

const readSingle = (buffer: ByteBuffer, pool: Pool): Attribute => {
    const nameEntry = pool[buffer.readUnsignedShort()] as UTF8Entry;
    const data = buffer.read(buffer.readInt());

    let attr: Attribute = {
        name: nameEntry.decode(),
        dirty: false,
        data,
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
    buffer.writeUnsignedShort(attr.nameEntry.index);
    buffer.writeInt(attr.data.length);

    if (attr.dirty) {
        // rebuild data if dirty
        attr.name = attr.nameEntry.decode();
        switch (attr.name) {
            case AttributeType.CODE: {
                attr.data = writeCode(attr as CodeAttribute);
                break;
            }
        }

        attr.dirty = false;
    }
    buffer.write(attr.data);
};

export const writeAttrs = (buffer: MutableByteBuffer, attrs: Attribute[]) => {
    buffer.writeUnsignedShort(attrs.length);
    for (const attr of attrs) {
        writeSingle(buffer, attr);
    }
};

export { CodeAttribute, ExceptionTableEntry };
