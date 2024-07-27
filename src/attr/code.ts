import { type Instruction, readInsns, writeInsns } from "../insn";
import type { Pool } from "../pool";
import { createBuffer, createMutableBuffer } from "../buffer";
import { AttributeType } from "../spec";
import { type Attributable, type Attribute, readAttrs, writeAttrs } from "./";

const TYPICAL_CODE_LENGTH = 8096 /* instructions */ + 16; /* exception table */

export interface ExceptionTableEntry {
    startPC: number;
    endPC: number;
    handlerPC: number;
    catchType: number;
}

export interface CodeAttribute extends Attribute, Attributable {
    maxStack: number;
    maxLocals: number;
    insns: Instruction[];
    exceptionTable: ExceptionTableEntry[];
}

export const readCode = (attr: Attribute, pool: Pool): CodeAttribute => {
    const buffer = createBuffer(attr.data);

    const codeAttr: Partial<CodeAttribute> = {
        ...attr,
        maxStack: buffer.readUnsignedShort(),
        maxLocals: buffer.readUnsignedShort(),
        attribute<T extends Attribute>(type: AttributeType): T | null {
            return this.attributes.find((a: Attribute) => type === a.name) || null;
        },
    };

    const codeLength = buffer.readUnsignedInt();
    codeAttr.insns = readInsns(buffer.read(codeLength));

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

export const writeCode = (attr: CodeAttribute, initialSize: number = TYPICAL_CODE_LENGTH): Uint8Array => {
    const buffer = createMutableBuffer(initialSize);

    buffer.writeUnsignedShort(attr.maxStack);
    buffer.writeUnsignedShort(attr.maxLocals);

    const code = writeInsns(attr.insns);
    buffer.writeUnsignedInt(code.length);
    buffer.write(code);

    buffer.writeUnsignedShort(attr.exceptionTable.length);
    for (const entry of attr.exceptionTable) {
        buffer.writeUnsignedShort(entry.startPC);
        buffer.writeUnsignedShort(entry.endPC);
        buffer.writeUnsignedShort(entry.handlerPC);
        buffer.writeUnsignedShort(entry.catchType);
    }

    writeAttrs(buffer, attr.attributes);

    return buffer.bufferView;
};
