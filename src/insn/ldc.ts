import { Instruction, InstructionKind } from "./";
import { Opcode } from "../spec";
import { createBuffer, createMutableBuffer } from "../buffer";

export interface ConstantInstruction extends Instruction {
    kind: InstructionKind.CONSTANT;
    opcode: Opcode.LDC | Opcode.LDC_W | Opcode.LDC2_W;
    index: number;
}

export const readLdc = (insn: Instruction): ConstantInstruction => {
    const buffer = createBuffer(insn.operands);

    const wide = insn.operands.length > 1;
    return {
        ...insn,
        kind: InstructionKind.CONSTANT,
        wide,
        index: wide ? buffer.readUnsignedShort() : buffer.readUnsignedByte(),
    };
};

export const writeLdc = (insn: ConstantInstruction): Instruction => {
    const buffer = createMutableBuffer(insn.wide ? 2 : 1);
    if (insn.wide) {
        buffer.writeUnsignedShort(insn.index);
    } else {
        buffer.writeUnsignedByte(insn.index);
    }

    return { ...insn, operands: buffer.bufferView };
};
