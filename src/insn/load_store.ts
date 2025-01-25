import { create, wrap } from "../buffer";
import { Opcode } from "../spec";
import { Instruction } from "./";

export interface LoadStoreInstruction extends Instruction {
    opcode:
        | Opcode.ALOAD
        | Opcode.ASTORE
        | Opcode.DLOAD
        | Opcode.DSTORE
        | Opcode.FLOAD
        | Opcode.FSTORE
        | Opcode.ILOAD
        | Opcode.ISTORE
        | Opcode.LLOAD
        | Opcode.LSTORE
        | Opcode.RET /* jsr return */
        | Opcode.GETFIELD
        | Opcode.GETSTATIC
        | Opcode.PUTFIELD
        | Opcode.PUTSTATIC;
    index: number;
}

export const readLoadStore = (insn: Instruction): LoadStoreInstruction => {
    const buffer = wrap(insn.operands);

    const wide = insn.operands.length > 1;
    return {
        ...insn,
        wide,
        index: wide ? buffer.getUint16() : buffer.getUint8(),
    };
};

export const writeLoadStore = (insn: LoadStoreInstruction): Instruction => {
    const buffer = create(insn.wide ? 2 : 1);
    if (insn.wide) {
        buffer.setUint16(insn.index);
    } else {
        buffer.setUint8(insn.index);
    }

    return { ...insn, operands: buffer.arrayView };
};
