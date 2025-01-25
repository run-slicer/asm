import { create, wrap } from "../buffer";
import { ArrayCode, Opcode } from "../spec";
import type { Instruction } from "./";

export interface ArrayInstruction extends Instruction {
    opcode: Opcode.ANEWARRAY | Opcode.NEWARRAY | Opcode.MULTIANEWARRAY;
    type: number | ArrayCode; // constant pool index or an array type code
    dimensions: number;
}

export const readArray = (insn: Instruction): ArrayInstruction => {
    const buffer = wrap(insn.operands);

    return {
        ...insn,
        type: insn.opcode === Opcode.NEWARRAY ? buffer.getUint8() : buffer.getUint16(),
        dimensions: insn.opcode === Opcode.MULTIANEWARRAY ? buffer.getUint8() : 1,
    };
};

export const writeArray = (insn: ArrayInstruction): Instruction => {
    const buffer = create(3); // max size
    if (insn.opcode === Opcode.NEWARRAY) {
        buffer.setUint8(insn.type);
    } else {
        buffer.setUint16(insn.type);
    }
    if (insn.opcode === Opcode.MULTIANEWARRAY) {
        buffer.setUint8(insn.dimensions);
    }

    return { ...insn, operands: buffer.arrayView };
};
