import { Instruction } from "./";
import { Opcode } from "../spec";
import { create, wrap } from "../buffer";

export interface ConstantInstruction extends Instruction {
    opcode: Opcode.LDC | Opcode.LDC_W | Opcode.LDC2_W;
    index: number;
}

export const readLdc = (insn: Instruction): ConstantInstruction => {
    const buffer = wrap(insn.operands);

    const wide = insn.operands.length > 1;
    return {
        ...insn,
        wide,
        index: wide ? buffer.getUint16() : buffer.getUint8(),
    };
};

export const writeLdc = (insn: ConstantInstruction): Instruction => {
    const buffer = create(insn.wide ? 2 : 1);
    if (insn.wide) {
        buffer.setUint16(insn.index);
    } else {
        buffer.setUint8(insn.index);
    }

    return { ...insn, operands: buffer.arrayView };
};
