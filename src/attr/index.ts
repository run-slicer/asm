import { type DirtyMarkable, FLAG_SKIP_ATTR, FLAG_SKIP_ATTR_PARSE } from "../";
import type { Buffer } from "../buffer";
import type { Pool, UTF8Entry } from "../pool";
import { AttributeType } from "../spec";
import {
    type BootstrapMethod,
    type BootstrapMethodArgument,
    type BootstrapMethodsAttribute,
    readBootstrapMethods,
    writeBootstrapMethods,
} from "./bsm";
import { type CodeAttribute, type ExceptionTableEntry, readCode, writeCode } from "./code";
import { type ConstantValueAttribute, readConstantValue, writeConstantValue } from "./constant_value";
import { type ExceptionEntry, type ExceptionsAttribute, readExceptions, writeExceptions } from "./exceptions";
import { type InnerClass, type InnerClassesAttribute, readInnerClasses, writeInnerClasses } from "./inner_classes";
import {
    type LocalVariable,
    type LocalVariableTableAttribute,
    readLocalVariableTable,
    writeLocalVariableTable,
} from "./lvt";
import {
    type NestHostAttribute,
    type NestMember,
    type NestMembersAttribute,
    readNestHost,
    readNestMembers,
    writeNestHost,
    writeNestMembers,
} from "./nest";
import {
    type PermittedSubclass,
    type PermittedSubclassesAttribute,
    readPermittedSubclasses,
    writePermittedSubclasses,
} from "./permitted_subclasses";
import { readRecord, type RecordAttribute, type RecordComponent, writeRecord } from "./record";
import { readSignature, type SignatureAttribute, writeSignature } from "./signature";
import { readSourceFile, type SourceFileAttribute, writeSourceFile } from "./source_file";

export interface Attribute extends DirtyMarkable {
    type?: AttributeType;
    nameIndex: number;
    data: Uint8Array;

    name?: UTF8Entry; // not present if index is invalid
}

export interface Attributable {
    attrs: Attribute[];
}

const readSingle = (buffer: Buffer, pool: Pool, flags: number): Attribute => {
    const nameIndex = buffer.getUint16();
    const name = pool[nameIndex] as UTF8Entry | undefined;

    const data = buffer.get(buffer.getInt32(), true);

    let attr: Attribute = {
        dirty: false,
        nameIndex,
        data,
        name,
    };
    if ((flags & FLAG_SKIP_ATTR_PARSE) === 0) {
        try {
            switch (name?.string) {
                case AttributeType.CODE:
                    attr = readCode(attr, pool, flags);
                    break;
                case AttributeType.SOURCE_FILE:
                    attr = readSourceFile(attr, pool);
                    break;
                case AttributeType.SIGNATURE:
                    attr = readSignature(attr, pool);
                    break;
                case AttributeType.LOCAL_VARIABLE_TABLE:
                    attr = readLocalVariableTable(attr, pool);
                    break;
                case AttributeType.EXCEPTIONS:
                    attr = readExceptions(attr, pool);
                    break;
                case AttributeType.CONSTANT_VALUE:
                    attr = readConstantValue(attr, pool);
                    break;
                case AttributeType.BOOTSTRAP_METHODS:
                    attr = readBootstrapMethods(attr, pool);
                    break;
                case AttributeType.RECORD:
                    attr = readRecord(attr, pool, flags);
                    break;
                case AttributeType.PERMITTED_SUBCLASSES:
                    attr = readPermittedSubclasses(attr, pool);
                    break;
                case AttributeType.NEST_HOST:
                    attr = readNestHost(attr, pool);
                    break;
                case AttributeType.NEST_MEMBERS:
                    attr = readNestMembers(attr, pool);
                    break;
                case AttributeType.INNER_CLASSES:
                    attr = readInnerClasses(attr, pool);
                    break;
            }
        } catch (e) {
            console.warn(`failed to parse ${name?.string || "unknown"} attribute, data length ${data.length}`);
            console.error(e);
        }
    }

    return attr;
};

export const readAttrs = (buffer: Buffer, pool: Pool, flags: number = 0): Attribute[] => {
    const attributesCount = buffer.getUint16();

    let attributes: Attribute[] = [];
    if ((flags & FLAG_SKIP_ATTR) === 0) {
        attributes = new Array<Attribute>(attributesCount);
        for (let i = 0; i < attributesCount; i++) {
            attributes[i] = readSingle(buffer, pool, flags);
        }
    } else {
        // skip attributes entirely
        for (let i = 0; i < attributesCount; i++) {
            buffer.offset += 2;
            const length = buffer.getInt32();
            buffer.offset += length;
        }
    }

    return attributes;
};

const writeSingle = (buffer: Buffer, attr: Attribute) => {
    if (attr.dirty) {
        // rebuild data if dirty
        switch (attr.type) {
            case AttributeType.CODE:
                attr.data = writeCode(attr as CodeAttribute);
                break;
            case AttributeType.SOURCE_FILE:
                attr.data = writeSourceFile(attr as SourceFileAttribute);
                break;
            case AttributeType.SIGNATURE:
                attr.data = writeSignature(attr as SignatureAttribute);
                break;
            case AttributeType.LOCAL_VARIABLE_TABLE:
                attr.data = writeLocalVariableTable(attr as LocalVariableTableAttribute);
                break;
            case AttributeType.EXCEPTIONS:
                attr.data = writeExceptions(attr as ExceptionsAttribute);
                break;
            case AttributeType.CONSTANT_VALUE:
                attr.data = writeConstantValue(attr as ConstantValueAttribute);
                break;
            case AttributeType.BOOTSTRAP_METHODS:
                attr.data = writeBootstrapMethods(attr as BootstrapMethodsAttribute);
                break;
            case AttributeType.RECORD:
                attr.data = writeRecord(attr as RecordAttribute);
                break;
            case AttributeType.PERMITTED_SUBCLASSES:
                attr.data = writePermittedSubclasses(attr as PermittedSubclassesAttribute);
                break;
            case AttributeType.NEST_HOST:
                attr.data = writeNestHost(attr as NestHostAttribute);
                break;
            case AttributeType.NEST_MEMBERS:
                attr.data = writeNestMembers(attr as NestMembersAttribute);
                break;
            case AttributeType.INNER_CLASSES:
                attr.data = writeInnerClasses(attr as InnerClassesAttribute);
                break;
        }

        attr.dirty = false;
    }

    buffer.setUint16(attr.nameIndex);
    buffer.setInt32(attr.data.length);
    buffer.set(attr.data);
};

export const writeAttrs = (buffer: Buffer, attrs: Attribute[]) => {
    buffer.setUint16(attrs.length);
    for (const attr of attrs) {
        writeSingle(buffer, attr);
    }
};

export {
    BootstrapMethod,
    BootstrapMethodArgument,
    BootstrapMethodsAttribute,
    CodeAttribute,
    ConstantValueAttribute,
    ExceptionEntry,
    ExceptionsAttribute,
    ExceptionTableEntry,
    InnerClass,
    InnerClassesAttribute,
    LocalVariable,
    LocalVariableTableAttribute,
    NestHostAttribute,
    NestMember,
    NestMembersAttribute,
    PermittedSubclass,
    PermittedSubclassesAttribute,
    RecordAttribute,
    RecordComponent,
    SignatureAttribute,
    SourceFileAttribute,
};
