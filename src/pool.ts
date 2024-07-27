import { ConstantType, type HandleKind } from "./spec";
import type { ByteBuffer, MutableByteBuffer } from "./buffer";

export interface Entry {
    type: ConstantType;
    index: number;
}

export interface NumericEntry extends Entry {
    type: ConstantType.INTEGER | ConstantType.FLOAT;
    value: number;
}

export interface WideNumericEntry extends Entry {
    type: ConstantType.LONG | ConstantType.DOUBLE;
    data: Uint8Array;
}

export interface ClassEntry extends Entry {
    type: ConstantType.CLASS;
    name: number; // UTF8Entry index
}

export interface UTF8Entry extends Entry {
    type: ConstantType.UTF8;
    data: Uint8Array;

    decode(): string;
}

export interface StringEntry extends Entry {
    type: ConstantType.STRING;
    data: number; // UTF8Entry index
}

export interface NameTypeEntry extends Entry {
    type: ConstantType.NAME_AND_TYPE;
    name: number; // UTF8Entry index
    type_: number; // UTF8Entry index
}

export interface RefEntry extends Entry {
    type: ConstantType.FIELDREF | ConstantType.METHODREF | ConstantType.INTERFACE_METHODREF;
    ref: number; // ClassEntry index
    nameType: number; // NameTypeEntry index
}

export interface ModularEntry extends Entry {
    type: ConstantType.MODULE | ConstantType.PACKAGE;
    name: number; // UTF8Entry index
}

export interface DynamicEntry extends Entry {
    type: ConstantType.DYNAMIC | ConstantType.INVOKE_DYNAMIC;
    bsmIndex: number;
    nameType: number; // NameTypeEntry index
}

export interface HandleEntry extends Entry {
    type: ConstantType.METHOD_HANDLE;
    ref: number; // RefEntry index
    kind: HandleKind;
}

export interface MethodTypeEntry extends Entry {
    type: ConstantType.METHOD_TYPE;
    descriptor: number; // UTF8Entry index
}

export type Pool = (Entry | null)[];

const decoder = new TextDecoder();
const readSingle = (buffer: ByteBuffer, index: number): Entry => {
    const type = buffer.readUnsignedByte();
    switch (type) {
        case ConstantType.UTF8:
            const length = buffer.readUnsignedShort();

            return {
                type,
                index,
                data: buffer.read(length),
                decode(): string {
                    return decoder.decode(this.data);
                },
            } as UTF8Entry;
        case ConstantType.INTEGER:
            return { type, index, value: buffer.readInt() } as NumericEntry;
        case ConstantType.FLOAT:
            return { type, index, value: buffer.readFloat() } as NumericEntry;
        case ConstantType.LONG:
        case ConstantType.DOUBLE:
            return { type, index, data: buffer.read(8) } as WideNumericEntry;
        case ConstantType.CLASS:
            return { type, index, name: buffer.readUnsignedShort() } as ClassEntry;
        case ConstantType.STRING:
            return { type, index, data: buffer.readUnsignedShort() } as StringEntry;
        case ConstantType.METHOD_TYPE:
            return { type, index, descriptor: buffer.readUnsignedShort() } as MethodTypeEntry;
        case ConstantType.MODULE:
        case ConstantType.PACKAGE:
            return { type, index, name: buffer.readUnsignedShort() } as ModularEntry;
        case ConstantType.FIELDREF:
        case ConstantType.METHODREF:
        case ConstantType.INTERFACE_METHODREF:
            return {
                type,
                index,
                ref: buffer.readUnsignedShort(),
                nameType: buffer.readUnsignedShort(),
            } as RefEntry;
        case ConstantType.NAME_AND_TYPE:
            return {
                type,
                index,
                name: buffer.readUnsignedShort(),
                type_: buffer.readUnsignedShort(),
            } as NameTypeEntry;
        case ConstantType.DYNAMIC:
        case ConstantType.INVOKE_DYNAMIC:
            return {
                type,
                index,
                bsmIndex: buffer.readUnsignedShort(),
                nameType: buffer.readUnsignedShort(),
            } as DynamicEntry;
        case ConstantType.METHOD_HANDLE:
            return { type, index, kind: buffer.readUnsignedByte(), ref: buffer.readUnsignedShort() } as HandleEntry;
        default:
            throw new Error("Unrecognized constant pool tag " + type + " at position " + index);
    }
};

export const readPool = (buffer: ByteBuffer): Pool => {
    const size = buffer.readUnsignedShort();

    const pool = new Array<Entry | null>(size);
    pool.fill(null);

    for (let i = 1; i < size; i++) {
        const entry = readSingle(buffer, i);
        pool[i] = entry;

        if (entry.type === ConstantType.DOUBLE || entry.type === ConstantType.LONG) {
            i++; // longs and doubles take two pool entries
        }
    }

    return pool;
};

const writeSingle = (buffer: MutableByteBuffer, entry: Entry) => {
    buffer.writeUnsignedByte(entry.type);
    switch (entry.type) {
        case ConstantType.UTF8:
            const utf8Entry = entry as UTF8Entry;

            buffer.writeUnsignedShort(utf8Entry.data.length);
            buffer.write(utf8Entry.data);
            break;
        case ConstantType.INTEGER:
            buffer.writeInt((entry as NumericEntry).value);
            break;
        case ConstantType.FLOAT:
            buffer.writeFloat((entry as NumericEntry).value);
            break;
        case ConstantType.LONG:
        case ConstantType.DOUBLE:
            buffer.write((entry as WideNumericEntry).data);
            break;
        case ConstantType.CLASS:
            buffer.writeUnsignedShort((entry as ClassEntry).name);
            break;
        case ConstantType.STRING:
            buffer.writeUnsignedShort((entry as StringEntry).data);
            break;
        case ConstantType.METHOD_TYPE:
            buffer.writeUnsignedShort((entry as MethodTypeEntry).descriptor);
            break;
        case ConstantType.MODULE:
        case ConstantType.PACKAGE:
            buffer.writeUnsignedShort((entry as ModularEntry).name);
            break;
        case ConstantType.FIELDREF:
        case ConstantType.METHODREF:
        case ConstantType.INTERFACE_METHODREF:
            const refEntry = entry as RefEntry;

            buffer.writeUnsignedShort(refEntry.ref);
            buffer.writeUnsignedShort(refEntry.nameType);
            break;
        case ConstantType.NAME_AND_TYPE:
            const nameTypeEntry = entry as NameTypeEntry;

            buffer.writeUnsignedShort(nameTypeEntry.name);
            buffer.writeUnsignedShort(nameTypeEntry.type_);
            break;
        case ConstantType.DYNAMIC:
        case ConstantType.INVOKE_DYNAMIC:
            const dynamicEntry = entry as DynamicEntry;

            buffer.writeUnsignedShort(dynamicEntry.bsmIndex);
            buffer.writeUnsignedShort(dynamicEntry.nameType);
            break;
        case ConstantType.METHOD_HANDLE:
            const handleEntry = entry as HandleEntry;

            buffer.writeUnsignedByte(handleEntry.kind);
            buffer.writeUnsignedShort(handleEntry.ref);
            break;
        default:
            throw new Error("Unrecognized constant pool tag " + entry.type + " at position " + entry.index);
    }
};

export const writePool = (buffer: MutableByteBuffer, pool: Pool) => {
    buffer.writeUnsignedShort(pool.length);
    for (let i = 1; i < pool.length; i++) {
        const entry = pool[i];

        writeSingle(buffer, entry);
        if (entry.type === ConstantType.DOUBLE || entry.type === ConstantType.LONG) {
            i++; // longs and doubles take two pool entries
        }
    }
};
