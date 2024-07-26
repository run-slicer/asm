import type { Pool, UTF8Entry } from "../pool";
import  { AttributeType } from "../spec";
import { type ByteBuffer, type MutableByteBuffer } from "../buffer";

export interface Attribute {
    name: UTF8Entry;
    data: Uint8Array;
}

export interface Attributable {
    attributes: Attribute[];

    attribute(type: AttributeType): Attribute | null;
}

const readSingle = (buffer: ByteBuffer, pool: Pool): Attribute => {
    return {
        name: pool[buffer.readUnsignedShort()] as UTF8Entry,
        data: buffer.read(buffer.readInt()),
    };
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
    buffer.writeUnsignedShort(attr.name.index);
    buffer.writeInt(attr.data.length);
    buffer.write(attr.data);
};

export const writeAttrs = (buffer: MutableByteBuffer, attrs: Attribute[]) => {
    buffer.writeUnsignedShort(attrs.length);
    for (const attr of attrs) {
        writeSingle(buffer, attr);
    }
};
