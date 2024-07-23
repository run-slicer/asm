import type { Reader } from "./reader";
import type { Pool, UTF8Entry } from "./pool";

export interface Attribute {
    name: UTF8Entry;
    data: Uint8Array;
}

export interface Attributable {
    attributes: Attribute[];
}

const readSingle = async (pool: Pool, reader: Reader): Promise<Attribute> => {
    return {
        name: pool[await reader.unsignedShort()] as UTF8Entry,
        data: await reader.bytes(await reader.integer()),
    };
};

export const read = async (pool: Pool, reader: Reader): Promise<Attribute[]> => {
    const attributesCount = await reader.unsignedShort();

    const attributes = new Array<Attribute>(attributesCount);
    for (let i = 0; i < attributesCount; i++) {
        attributes[i] = await readSingle(pool, reader);
    }

    return attributes;
};
