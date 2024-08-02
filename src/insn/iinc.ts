import { Instruction, InstructionKind } from "./";
import { Opcode } from "../spec";
import { createBuffer, createMutableBuffer } from "../buffer";

export interface IncrementInstruction extends Instruction {
    kind: InstructionKind.INCREMENT;
    opcode: Opcode.IINC;
    index: number;
    const: number;
}

export const readIinc = (insn: Instruction): IncrementInstruction => {
    const buffer = createBuffer(insn.operands);

    const wide = insn.operands.length > 2;
    return {
        ...insn,
        kind: InstructionKind.INCREMENT,
        wide,
        index: wide ? buffer.readUnsignedShort() : buffer.readUnsignedByte(),
        const: wide ? buffer.readShort() : buffer.readByte(),
    };
};

export const writeIinc = (insn: IncrementInstruction): Instruction => {
    const buffer = createMutableBuffer(insn.wide ? 4 : 2);
    if (insn.wide) {
        buffer.writeUnsignedShort(insn.index);
        buffer.writeShort(insn.const);
    } else {
        buffer.writeUnsignedByte(insn.index);
        buffer.writeByte(insn.const);
    }

    return { ...insn, operands: buffer.bufferView };
};
