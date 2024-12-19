import { type Instruction, readInsns, writeInsns } from "../insn";
import type { Pool } from "../pool";
import { create, wrap } from "../buffer";
import { type Attributable, type Attribute, readAttrs, writeAttrs } from "./";
import { AttributeType } from "../spec";

const TYPICAL_CODE_LENGTH = 8096 /* instructions */ + 16; /* exception table */

export interface ExceptionTableEntry {
    startPC: number;
    endPC: number;
    handlerPC: number;
    catchType: number;
}

export interface CodeAttribute extends Attribute, Attributable {
    name: AttributeType.CODE;
    maxStack: number;
    maxLocals: number;
    insns: Instruction[];
    exceptionTable: ExceptionTableEntry[];
}

export const readCode = (attr: Attribute, pool: Pool): CodeAttribute => {
    const buffer = wrap(attr.data);

    const codeAttr: Partial<CodeAttribute> = {
        ...attr,
        name: AttributeType.CODE,
        maxStack: buffer.getUint16(),
        maxLocals: buffer.getUint16(),
    };

    const codeLength = buffer.getUint32();
    codeAttr.insns = readInsns(buffer.get(codeLength));

    const excTableLength = buffer.getUint16();

    codeAttr.exceptionTable = new Array<ExceptionTableEntry>(excTableLength);
    for (let i = 0; i < excTableLength; i++) {
        codeAttr.exceptionTable[i] = {
            startPC: buffer.getUint16(),
            endPC: buffer.getUint16(),
            handlerPC: buffer.getUint16(),
            catchType: buffer.getUint16(),
        };
    }

    codeAttr.attrs = readAttrs(buffer, pool);

    return codeAttr as CodeAttribute;
};

export const writeCode = (attr: CodeAttribute, initialSize: number = TYPICAL_CODE_LENGTH): Uint8Array => {
    const buffer = create(initialSize);

    buffer.setUint16(attr.maxStack);
    buffer.setUint16(attr.maxLocals);

    const code = writeInsns(attr.insns);
    buffer.setUint32(code.length);
    buffer.set(code);

    buffer.setUint16(attr.exceptionTable.length);
    for (const entry of attr.exceptionTable) {
        buffer.setUint16(entry.startPC);
        buffer.setUint16(entry.endPC);
        buffer.setUint16(entry.handlerPC);
        buffer.setUint16(entry.catchType);
    }

    writeAttrs(buffer, attr.attrs);

    return buffer.arrayView;
};
