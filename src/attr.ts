import type { Pool, UTF8Entry } from "./pool";
import type { ByteBuffer, MutableByteBuffer } from "./buffer";

export interface Attribute {
    name: UTF8Entry;
    data: Uint8Array;
}

export interface Attributable {
    attributes: Attribute[];
}

const readSingle = (buffer: ByteBuffer, pool: Pool): Attribute => {
    return {
        name: pool[buffer.readUnsignedShort()] as UTF8Entry,
        data: new Uint8Array(buffer.read(buffer.readInt())),
    };
};

export const readAttributes = (buffer: ByteBuffer, pool: Pool): Attribute[] => {
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
    buffer.write(attr.data.buffer);
};

export const writeAttributes = (buffer: MutableByteBuffer, attrs: Attribute[]) => {
    buffer.writeUnsignedShort(attrs.length);
    for (const attr of attrs) {
        writeSingle(buffer, attr);
    }
};
