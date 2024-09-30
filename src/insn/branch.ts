import { Opcode } from "../spec";
import { Instruction } from "./";
import { create, wrap } from "../buffer";

export interface BranchInstruction extends Instruction {
    opcode:
        | Opcode.IFEQ
        | Opcode.IFNE
        | Opcode.IFLT
        | Opcode.IFGE
        | Opcode.IFGT
        | Opcode.IFLE
        | Opcode.IF_ICMPEQ
        | Opcode.IF_ICMPNE
        | Opcode.IF_ICMPLT
        | Opcode.IF_ICMPGE
        | Opcode.IF_ICMPGT
        | Opcode.IF_ICMPLE
        | Opcode.IF_ACMPEQ
        | Opcode.IF_ACMPNE
        | Opcode.GOTO
        | Opcode.GOTO_W
        | Opcode.JSR
        | Opcode.JSR_W
        | Opcode.IFNULL
        | Opcode.IFNONNULL;
    branchOffset: number;
}

export const readBranch = (insn: Instruction): BranchInstruction => {
    const buffer = wrap(insn.operands);

    const wide = insn.opcode === Opcode.GOTO_W || insn.opcode === Opcode.JSR_W;
    return {
        ...insn,
        wide,
        branchOffset: wide ? buffer.getInt32() : buffer.getInt16(),
    };
};

export const writeBranch = (insn: BranchInstruction): Instruction => {
    const buffer = create(insn.wide ? 4 : 2);
    if (insn.wide) {
        buffer.setInt32(insn.branchOffset);
    } else {
        buffer.setInt16(insn.branchOffset);
    }

    return { ...insn, operands: buffer.arrayView };
};
