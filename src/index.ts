import { type ClassEntry, type UTF8Entry, type Pool, readPool, writePool } from "./pool";
import { type Attributable, readAttrs, writeAttrs } from "./attr";
import { type ByteBuffer, type MutableByteBuffer, createBuffer, createMutableBuffer } from "./buffer";

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

const readMember = (buffer: ByteBuffer, pool: Pool): Member => {
    return {
        access: buffer.readUnsignedShort(),
        name: pool[buffer.readUnsignedShort()] as UTF8Entry,
        type: pool[buffer.readUnsignedShort()] as UTF8Entry,
        attributes: readAttrs(buffer, pool),
    };
};

export const read = (buf: ArrayBuffer): Node => {
    const buffer = createBuffer(buf);

    const node: Partial<Node> = {
        magic: buffer.readUnsignedInt(),
        minor: buffer.readUnsignedShort(),
        major: buffer.readUnsignedShort(),
        pool: readPool(buffer),
        access: buffer.readUnsignedShort(),
    };

    node.thisClass = node.pool[buffer.readUnsignedShort()] as ClassEntry;

    const superIndex = buffer.readUnsignedShort();
    if (superIndex !== 0) {
        node.superClass = node.pool[superIndex] as ClassEntry;
    }

    const interfacesCount = buffer.readUnsignedShort();

    node.interfaces = new Array(interfacesCount);
    for (let i = 0; i < interfacesCount; i++) {
        node.interfaces[i] = node.pool[buffer.readUnsignedShort()] as ClassEntry;
    }

    const fieldsCount = buffer.readUnsignedShort();

    node.fields = new Array(fieldsCount);
    for (let i = 0; i < fieldsCount; i++) {
        node.fields[i] = readMember(buffer, node.pool);
    }

    const methodsCount = buffer.readUnsignedShort();

    node.methods = new Array(methodsCount);
    for (let i = 0; i < methodsCount; i++) {
        node.methods[i] = readMember(buffer, node.pool);
    }

    node.attributes = readAttrs(buffer, node.pool);

    return node as Node;
};

const writeMember = (buffer: MutableByteBuffer, member: Member) => {
    buffer.writeUnsignedShort(member.access);
    buffer.writeUnsignedShort(member.name.index);
    buffer.writeUnsignedShort(member.type.index);
    writeAttrs(buffer, member.attributes);
};

export const write = (node: Node, initialSize: number = 0): ArrayBuffer => {
    const buffer = createMutableBuffer(initialSize);

    buffer.writeUnsignedInt(node.magic);
    buffer.writeUnsignedShort(node.minor);
    buffer.writeUnsignedShort(node.major);
    writePool(buffer, node.pool);
    buffer.writeUnsignedShort(node.access);
    buffer.writeUnsignedShort(node.thisClass.index);
    buffer.writeUnsignedShort(node.superClass ? node.superClass.index : 0);

    buffer.writeUnsignedShort(node.interfaces.length);
    for (const interface_ of node.interfaces) {
        buffer.writeUnsignedShort(interface_.index);
    }

    buffer.writeUnsignedShort(node.fields.length);
    for (const field of node.fields) {
        writeMember(buffer, field);
    }

    buffer.writeUnsignedShort(node.methods.length);
    for (const method of node.methods) {
        writeMember(buffer, method);
    }

    writeAttrs(buffer, node.attributes);

    return buffer.buffer;
};
