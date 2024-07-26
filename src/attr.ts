import type { Pool, UTF8Entry } from "./pool";
import { type ByteBuffer, type MutableByteBuffer, createBuffer, createMutableBuffer } from "./buffer";
import { type Instruction, readInsns, writeInsns } from "./insn";

export interface Attribute {
    name: UTF8Entry;
    data: Uint8Array;
}

export interface Attributable {
    attributes: Attribute[];
}

const readSingle = (buffer: ByteBuffer, pool: Pool): Attribute => {
    return {
        name: pool[buffer.readUnsignedShort()] as UTF8Entry,
        data: new Uint8Array(buffer.read(buffer.readInt())),
    };
};

export const readAttrs = (buffer: ByteBuffer, pool: Pool): Attribute[] => {
    const attributesCount = buffer.readUnsignedShort();

    const attributes = new Array<Attribute>(attributesCount);
    for (let i = 0; i < attributesCount; i++) {
        attributes[i] = readSingle(buffer, pool);
    }

    return attributes;
};

const writeSingle = (buffer: MutableByteBuffer, attr: Attribute) => {
    buffer.writeUnsignedShort(attr.name.index);
    buffer.writeInt(attr.data.length);
    buffer.write(attr.data.buffer);
};

export const writeAttrs = (buffer: MutableByteBuffer, attrs: Attribute[]) => {
    buffer.writeUnsignedShort(attrs.length);
    for (const attr of attrs) {
        writeSingle(buffer, attr);
    }
};

export interface ExceptionTableEntry {
    startPC: number;
    endPC: number;
    handlerPC: number;
    catchType: number;
}

export interface CodeAttribute extends Attribute, Attributable {
    maxStack: number;
    maxLocals: number;
    code: Instruction[];
    exceptionTable: ExceptionTableEntry[];
}

export const readCodeAttr = (attr: Attribute, pool: Pool): CodeAttribute => {
    const buffer = createBuffer(attr.data.buffer);

    const codeAttr: Partial<CodeAttribute> = {
        ...attr,
        maxStack: buffer.readUnsignedShort(),
        maxLocals: buffer.readUnsignedShort(),
    };

    const codeLength = buffer.readUnsignedInt();
    codeAttr.code = readInsns(new Uint8Array(buffer.read(codeLength)));

    const excTableLength = buffer.readUnsignedShort();

    codeAttr.exceptionTable = new Array<ExceptionTableEntry>(excTableLength);
    for (let i = 0; i < excTableLength; i++) {
        codeAttr.exceptionTable[i] = {
            startPC: buffer.readUnsignedShort(),
            endPC: buffer.readUnsignedShort(),
            handlerPC: buffer.readUnsignedShort(),
            catchType: buffer.readUnsignedShort(),
        };
    }

    codeAttr.attributes = readAttrs(buffer, pool);

    return codeAttr as CodeAttribute;
};

export const writeCodeAttr = (attr: CodeAttribute, initialSize: number = 0): Attribute => {
    const buffer = createMutableBuffer(initialSize);

    buffer.writeUnsignedShort(attr.maxStack);
    buffer.writeUnsignedShort(attr.maxLocals);

    const code = writeInsns(attr.code);
    buffer.writeUnsignedInt(code.length);
    buffer.write(code.buffer);

    buffer.writeUnsignedShort(attr.exceptionTable.length);
    for (const entry of attr.exceptionTable) {
        buffer.writeUnsignedShort(entry.startPC);
        buffer.writeUnsignedShort(entry.endPC);
        buffer.writeUnsignedShort(entry.handlerPC);
        buffer.writeUnsignedShort(entry.catchType);
    }

    writeAttrs(buffer, attr.attributes);

    // update attribute
    attr.data = new Uint8Array(buffer.buffer);
    return attr;
};
