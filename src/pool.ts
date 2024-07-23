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

export const read = async (reader: Reader): Promise<Pool> => {
    const size = await reader.unsignedShort();

    const pool = new Array<Entry | null>(size);
    pool.fill(null);

    for (let i = 1; i < size; i++) {
        const type = await reader.unsignedByte();
        switch (type) {
            case ConstantType.UTF8:
                pool[i] = { type, index: i, value: await reader.utf() } as UTF8Entry;
                break;
            case ConstantType.INTEGER:
                pool[i] = { type, index: i, value: await reader.integer() } as IntegerEntry;
                break;
            case ConstantType.FLOAT:
                await reader.skip(4); // skip float
                break;
            case ConstantType.LONG:
                pool[i] = { type, index: i, value: await reader.long() } as LongEntry;
                i++; // longs take two constant pool entries
                break;
            case ConstantType.DOUBLE:
                await reader.skip(8); // skip double
                i++; // doubles take two constant pool entries
                break;
            case ConstantType.CLASS:
                pool[i] = { type, index: i, name: await reader.unsignedShort() } as ClassEntry;
                break;
            case ConstantType.STRING:
                pool[i] = { type, index: i, data: await reader.unsignedShort() } as StringEntry;
                break;
            case ConstantType.METHOD_TYPE:
                pool[i] = { type, index: i, descriptor: await reader.unsignedShort() } as MethodTypeEntry;
                break;
            case ConstantType.MODULE:
            case ConstantType.PACKAGE:
                pool[i] = { type, index: i, name: await reader.unsignedShort() } as ModularEntry;
                break;
            case ConstantType.FIELDREF:
            case ConstantType.METHODREF:
            case ConstantType.INTERFACE_METHODREF:
                pool[i] = { type, index: i, ref: await reader.unsignedShort(), nameType: await reader.unsignedShort() } as RefEntry;
                break;
            case ConstantType.NAME_AND_TYPE:
                pool[i] = { type, index: i, name: await reader.unsignedShort(), type_: await reader.unsignedShort() } as NameTypeEntry;
                break;
            case ConstantType.DYNAMIC:
            case ConstantType.INVOKE_DYNAMIC:
                pool[i] = { type, index: i, bsmIndex: await reader.unsignedShort(), nameType: await reader.unsignedShort() } as DynamicEntry;
                break;
            case ConstantType.METHOD_HANDLE:
                pool[i] = { type, index: i, kind: await reader.unsignedByte(), ref: await reader.unsignedShort() } as HandleEntry;
                break;
            default:
                throw new Error("Invalid constant pool tag " + type + " at position " + i);
        }
    }

    return pool;
};
