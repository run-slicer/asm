import { type Instruction } from "./";
import { Opcode } from "../spec";
import { create, wrap } from "../buffer";

export interface TypeInstruction extends Instruction {
    opcode: Opcode.CHECKCAST | Opcode.INSTANCEOF | Opcode.NEW;
    index: number;
}

export const readType = (insn: Instruction): TypeInstruction => {
    const buffer = wrap(insn.operands);

    return {
        ...insn,
        index: buffer.getUint16(),
    };
};

export const writeType = (insn: TypeInstruction): Instruction => {
    const buffer = create(2);
    buffer.setUint16(insn.index);

    return { ...insn, operands: buffer.arrayView };
};
