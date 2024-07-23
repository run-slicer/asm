import { type ClassEntry, type Pool, read as readPool, UTF8Entry } from "./pool";
import type { Reader } from "./reader";
import { type Attributable, read as readAttributes } from "./attr";

export interface Member extends Attributable {
    access: number;
    name: UTF8Entry;
    type: UTF8Entry;
}

export interface Node extends Attributable {
    magic: number;
    minor: number;
    major: number;
    pool: Pool;
    access: number;
    thisClass: ClassEntry;
    superClass?: ClassEntry;
    interfaces: ClassEntry[];
    fields: Member[];
    methods: Member[];
}

export const read = async (reader: Reader): Promise<Node> => {
    const node: Partial<Node> = {
        magic: await reader.integer(),
        minor: await reader.unsignedShort(),
        major: await reader.unsignedShort(),
        pool: await readPool(reader),
        access: await reader.unsignedShort(),
    };

    node.thisClass = node.pool[await reader.unsignedShort()] as ClassEntry;

    const superIndex = await reader.unsignedShort();
    if (superIndex !== 0) {
        node.superClass = node.pool[superIndex] as ClassEntry;
    }

    const interfacesCount = await reader.unsignedShort();

    node.interfaces = new Array(interfacesCount);
    for (let i = 0; i < interfacesCount; i++) {
        node.interfaces[i] = node.pool[await reader.unsignedShort()] as ClassEntry;
    }

    const fieldsCount = await reader.unsignedShort();

    node.fields = new Array(fieldsCount);
    for (let i = 0; i < fieldsCount; i++) {
        node.fields[i] = await readMember(node.pool, reader);
    }

    const methodsCount = await reader.unsignedShort();

    node.methods = new Array(methodsCount);
    for (let i = 0; i < methodsCount; i++) {
        node.methods[i] = await readMember(node.pool, reader);
    }

    node.attributes = await readAttributes(node.pool, reader);

    return node as Node;
};

const readMember = async (pool: Pool, reader: Reader): Promise<Member> => {
    return {
        access: await reader.unsignedShort(),
        name: pool[await reader.unsignedShort()] as UTF8Entry,
        type: pool[await reader.unsignedShort()] as UTF8Entry,
        attributes: await readAttributes(pool, reader),
    };
};
