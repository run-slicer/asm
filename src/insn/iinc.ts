import { Instruction } from "./";
import { Opcode } from "../spec";
import { create, wrap } from "../buffer";

export interface IncrementInstruction extends Instruction {
    opcode: Opcode.IINC;
    index: number;
    const: number;
}

export const readIinc = (insn: Instruction): IncrementInstruction => {
    const buffer = wrap(insn.operands);

    const wide = insn.operands.length > 2;
    return {
        ...insn,
        wide,
        index: wide ? buffer.getUint16() : buffer.getUint8(),
        const: wide ? buffer.getInt16() : buffer.getInt8(),
    };
};

export const writeIinc = (insn: IncrementInstruction): Instruction => {
    const buffer = create(insn.wide ? 4 : 2);
    if (insn.wide) {
        buffer.setUint16(insn.index);
        buffer.setInt16(insn.const);
    } else {
        buffer.setUint8(insn.index);
        buffer.setInt8(insn.const);
    }

    return { ...insn, operands: buffer.arrayView };
};
