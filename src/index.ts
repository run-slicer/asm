import { type ClassEntry, type UTF8Entry, type Pool, readPool, writePool } from "./pool";
import { type Attributable, readAttrs, writeAttrs } from "./attr";
import { type Buffer, create, wrap } from "./buffer";

export interface DirtyMarkable {
    dirty: boolean;
}

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

const readMember = (buffer: Buffer, pool: Pool): Member => {
    return {
        access: buffer.getUint16(),
        name: pool[buffer.getUint16()] as UTF8Entry,
        type: pool[buffer.getUint16()] as UTF8Entry,
        attrs: readAttrs(buffer, pool),
    };
};

export const read = (buf: Uint8Array): Node => {
    const buffer = wrap(buf);

    const node: Partial<Node> = {
        magic: buffer.getUint32(),
        minor: buffer.getUint16(),
        major: buffer.getUint16(),
        pool: readPool(buffer),
        access: buffer.getUint16(),
    };

    node.thisClass = node.pool[buffer.getUint16()] as ClassEntry;

    const superIndex = buffer.getUint16();
    if (superIndex !== 0) {
        node.superClass = node.pool[superIndex] as ClassEntry;
    }

    const interfacesCount = buffer.getUint16();

    node.interfaces = new Array(interfacesCount);
    for (let i = 0; i < interfacesCount; i++) {
        node.interfaces[i] = node.pool[buffer.getUint16()] as ClassEntry;
    }

    const fieldsCount = buffer.getUint16();

    node.fields = new Array(fieldsCount);
    for (let i = 0; i < fieldsCount; i++) {
        node.fields[i] = readMember(buffer, node.pool);
    }

    const methodsCount = buffer.getUint16();

    node.methods = new Array(methodsCount);
    for (let i = 0; i < methodsCount; i++) {
        node.methods[i] = readMember(buffer, node.pool);
    }

    node.attrs = readAttrs(buffer, node.pool);

    return node as Node;
};

const writeMember = (buffer: Buffer, member: Member) => {
    buffer.setUint16(member.access);
    buffer.setUint16(member.name.index);
    buffer.setUint16(member.type.index);
    writeAttrs(buffer, member.attrs);
};

export const write = (node: Node, initialSize?: number): Uint8Array => {
    const buffer = create(initialSize);

    buffer.setUint32(node.magic);
    buffer.setUint16(node.minor);
    buffer.setUint16(node.major);
    writePool(buffer, node.pool);
    buffer.setUint16(node.access);
    buffer.setUint16(node.thisClass.index);
    buffer.setUint16(node.superClass ? node.superClass.index : 0);

    buffer.setUint16(node.interfaces.length);
    for (const interface_ of node.interfaces) {
        buffer.setUint16(interface_.index);
    }

    buffer.setUint16(node.fields.length);
    for (const field of node.fields) {
        writeMember(buffer, field);
    }

    buffer.setUint16(node.methods.length);
    for (const method of node.methods) {
        writeMember(buffer, method);
    }

    writeAttrs(buffer, node.attrs);

    return buffer.arrayView;
};
