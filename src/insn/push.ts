import { Instruction } from "./";
import { Opcode } from "../spec";
import { create, wrap } from "../buffer";

export interface PushInstruction extends Instruction {
    opcode: Opcode.BIPUSH | Opcode.SIPUSH;
    value: number;
}

export const readPush = (insn: Instruction): PushInstruction => {
    const buffer = wrap(insn.operands);

    return {
        ...insn,
        value: insn.opcode === Opcode.SIPUSH ? buffer.getUint16() : buffer.getUint8(),
    };
};

export const writePush = (insn: PushInstruction): Instruction => {
    const short = insn.opcode === Opcode.SIPUSH;

    const buffer = create(short ? 2 : 1);
    if (short) {
        buffer.setUint16(insn.value);
    } else {
        buffer.setUint8(insn.value);
    }

    return { ...insn, operands: buffer.arrayView };
};
