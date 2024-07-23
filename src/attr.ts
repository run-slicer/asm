import type { Reader } from "./reader";
import type { Pool, UTF8Entry } from "./pool";
import type { Writer } from "./writer";

export interface Attribute {
    name: UTF8Entry;
    data: Uint8Array;
}

export interface Attributable {
    attributes: Attribute[];
}

const readSingle = async (reader: Reader, pool: Pool): Promise<Attribute> => {
    return {
        name: pool[await reader.unsignedShort()] as UTF8Entry,
        data: await reader.bytes(await reader.integer()),
    };
};

export const read = async (reader: Reader, pool: Pool): Promise<Attribute[]> => {
    const attributesCount = await reader.unsignedShort();

    const attributes = new Array<Attribute>(attributesCount);
    for (let i = 0; i < attributesCount; i++) {
        attributes[i] = await readSingle(reader, pool);
    }

    return attributes;
};

const writeSingle = async (writer: Writer, attr: Attribute) => {
    await writer.short(attr.name.index);
    await writer.integer(attr.data.length);
    await writer.bytes(attr.data);
};

export const write = async (writer: Writer, attrs: Attribute[]) => {
    await writer.short(attrs.length);
    for (const attr of attrs) {
        await writeSingle(writer, attr);
    }
};
