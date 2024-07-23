import type { Reader, UTFData } from "./reader";
import { ConstantType, type HandleKind } from "./spec";

export interface Entry {
    type: ConstantType;
    index: number;
}

export interface IntegerEntry extends Entry {
    type: ConstantType.INTEGER;
    value: number;
}

export interface LongEntry extends Entry {
    type: ConstantType.LONG;
    value: bigint;
}

export interface FPEntry extends Entry {
    type: ConstantType.FLOAT | ConstantType.DOUBLE;
    value: Uint8Array;
}

export interface ClassEntry extends Entry {
    type: ConstantType.CLASS;
    name: number; // UTF8Entry index
}

export interface UTF8Entry extends Entry {
    type: ConstantType.UTF8;
    value: UTFData;
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

const readSingle = async (index: number, reader: Reader): Promise<Entry> => {
    const type = await reader.unsignedByte();
    switch (type) {
        case ConstantType.UTF8:
            return { type, index, value: await reader.utf() } as UTF8Entry;
        case ConstantType.INTEGER:
            return { type, index, value: await reader.integer() } as IntegerEntry;
        case ConstantType.FLOAT:
            return { type, index, value: await reader.bytes(4) } as FPEntry;
        case ConstantType.LONG:
            return { type, index, value: await reader.long() } as LongEntry;
        case ConstantType.DOUBLE:
            return { type, index, value: await reader.bytes(8) } as FPEntry;
        case ConstantType.CLASS:
            return { type, index, name: await reader.unsignedShort() } as ClassEntry;
        case ConstantType.STRING:
            return { type, index, data: await reader.unsignedShort() } as StringEntry;
        case ConstantType.METHOD_TYPE:
            return { type, index, descriptor: await reader.unsignedShort() } as MethodTypeEntry;
        case ConstantType.MODULE:
        case ConstantType.PACKAGE:
            return { type, index, name: await reader.unsignedShort() } as ModularEntry;
        case ConstantType.FIELDREF:
        case ConstantType.METHODREF:
        case ConstantType.INTERFACE_METHODREF:
            return { type, index, ref: await reader.unsignedShort(), nameType: await reader.unsignedShort() } as RefEntry;
        case ConstantType.NAME_AND_TYPE:
            return { type, index, name: await reader.unsignedShort(), type_: await reader.unsignedShort() } as NameTypeEntry;
        case ConstantType.DYNAMIC:
        case ConstantType.INVOKE_DYNAMIC:
            return { type, index, bsmIndex: await reader.unsignedShort(), nameType: await reader.unsignedShort() } as DynamicEntry;
        case ConstantType.METHOD_HANDLE:
            return { type, index, kind: await reader.unsignedByte(), ref: await reader.unsignedShort() } as HandleEntry;
        default:
            throw new Error("Invalid constant pool tag " + type + " at position " + index);
    }
};

export const read = async (reader: Reader): Promise<Pool> => {
    const size = await reader.unsignedShort();

    const pool = new Array<Entry | null>(size);
    pool.fill(null);

    for (let i = 1; i < size; i++) {
        const entry = await readSingle(i, reader);
        pool[i] = entry;

        if (entry.type === ConstantType.DOUBLE || entry.type === ConstantType.LONG) {
            i++; // longs and doubles take two pool entries
        }
    }

    return pool;
};
