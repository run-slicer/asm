import { type Instruction } from "./";
import { Opcode } from "../spec";
import { createBuffer, createMutableBuffer } from "../buffer";

export interface TypeInstruction extends Instruction {
    opcode: Opcode.CHECKCAST | Opcode.INSTANCEOF | Opcode.NEW;
    index: number;
}

export const readType = (insn: Instruction): TypeInstruction => {
    const buffer = createBuffer(insn.operands);

    return {
        ...insn,
        index: buffer.readUnsignedShort(),
    };
};

export const writeType = (insn: TypeInstruction): Instruction => {
    const buffer = createMutableBuffer(2);
    buffer.writeUnsignedShort(insn.index);

    return { ...insn, operands: buffer.bufferView };
};
