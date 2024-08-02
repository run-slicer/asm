import type { Instruction } from "./";
import { Opcode, ArrayCode } from "../spec";
import { createBuffer, createMutableBuffer } from "../buffer";

export interface ArrayInstruction extends Instruction {
    opcode: Opcode.ANEWARRAY | Opcode.NEWARRAY | Opcode.MULTIANEWARRAY;
    type: number | ArrayCode; // constant pool index or an array type code
    dimensions: number;
}

export const readArray = (insn: Instruction): ArrayInstruction => {
    const buffer = createBuffer(insn.operands);

    return {
        ...insn,
        type: insn.opcode === Opcode.NEWARRAY ? buffer.readUnsignedByte() : buffer.readUnsignedShort(),
        dimensions: insn.opcode === Opcode.MULTIANEWARRAY ? buffer.readUnsignedByte() : 1,
    };
};

export const writeArray = (insn: ArrayInstruction): Instruction => {
    const buffer = createMutableBuffer(3); // max size
    if (insn.opcode === Opcode.NEWARRAY) {
        buffer.writeUnsignedByte(insn.type);
    } else {
        buffer.writeUnsignedShort(insn.type);
    }
    if (insn.opcode === Opcode.MULTIANEWARRAY) {
        buffer.writeUnsignedByte(insn.dimensions);
    }

    return { ...insn, operands: buffer.bufferView };
};
