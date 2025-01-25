import { create, wrap } from "../buffer";
import { Opcode } from "../spec";
import { Instruction } from "./";

export interface InvokeInstruction extends Instruction {
    opcode:
        | Opcode.INVOKEDYNAMIC
        | Opcode.INVOKEINTERFACE
        | Opcode.INVOKESPECIAL
        | Opcode.INVOKESTATIC
        | Opcode.INVOKEVIRTUAL;
    ref: number;
}

export interface InvokeInterfaceInstruction extends InvokeInstruction {
    opcode: Opcode.INVOKEINTERFACE;
    count: number;
}

export const readInvoke = (insn: Instruction): InvokeInstruction => {
    const buffer = wrap(insn.operands);

    const invokeInsn: Partial<InvokeInstruction> = {
        ...insn,
        ref: buffer.getUint16(),
    };

    if (insn.opcode === Opcode.INVOKEINTERFACE) {
        const iifInsn = invokeInsn as InvokeInterfaceInstruction;

        iifInsn.count = buffer.getUint8();
    }

    return invokeInsn as InvokeInstruction;
};

export const writeInvoke = (insn: InvokeInstruction): Instruction => {
    const hasPadding = insn.opcode === Opcode.INVOKEDYNAMIC || insn.opcode === Opcode.INVOKEINTERFACE;

    const buffer = create(hasPadding ? 4 : 2);
    buffer.setUint16(insn.ref);

    if (hasPadding) {
        let neededZeroes = 2;
        if (insn.opcode === Opcode.INVOKEINTERFACE) {
            const iifInsn = insn as InvokeInterfaceInstruction;

            buffer.setUint8(iifInsn.count);
            neededZeroes--;
        }

        buffer.set(new Uint8Array(neededZeroes) /* zeroed array */);
    }

    return { ...insn, operands: buffer.arrayView };
};
