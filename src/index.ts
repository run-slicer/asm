import { type ClassEntry, type Pool, read as readPool, write as writePool, type UTF8Entry } from "./pool";
import type { Reader } from "./reader";
import { type Attributable, read as readAttributes, write as writeAttributes } from "./attr";
import type { Writer } from "./writer";

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

const readMember = async (reader: Reader, pool: Pool): Promise<Member> => {
    return {
        access: await reader.unsignedShort(),
        name: pool[await reader.unsignedShort()] as UTF8Entry,
        type: pool[await reader.unsignedShort()] as UTF8Entry,
        attributes: await readAttributes(reader, pool),
    };
};

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
        node.fields[i] = await readMember(reader, node.pool);
    }

    const methodsCount = await reader.unsignedShort();

    node.methods = new Array(methodsCount);
    for (let i = 0; i < methodsCount; i++) {
        node.methods[i] = await readMember(reader, node.pool);
    }

    node.attributes = await readAttributes(reader, node.pool);

    return node as Node;
};

const writeMember = async (writer: Writer, member: Member) => {
    await writer.short(member.access);
    await writer.short(member.name.index);
    await writer.short(member.type.index);
    await writeAttributes(writer, member.attributes);
};

export const write = async (writer: Writer, node: Node) => {
    await writer.integer(node.magic);
    await writer.short(node.minor);
    await writer.short(node.major);
    await writePool(writer, node.pool);
    await writer.short(node.access);
    await writer.short(node.thisClass.index);
    await writer.short(node.superClass ? node.superClass.index : 0);

    for (const interface_ of node.interfaces) {
        await writer.short(interface_.index);
    }
    for (const field of node.fields) {
        await writeMember(writer, field);
    }
    for (const method of node.methods) {
        await writeMember(writer, method);
    }

    await writeAttributes(writer, node.attributes);
};
