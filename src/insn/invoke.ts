import { Instruction } from "./";
import { Opcode } from "../spec";
import { createBuffer, createMutableBuffer } from "../buffer";

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
    const buffer = createBuffer(insn.operands);

    const invokeInsn: Partial<InvokeInstruction> = {
        ...insn,
        ref: buffer.readUnsignedShort(),
    };

    if (insn.opcode === Opcode.INVOKEINTERFACE) {
        const iifInsn = invokeInsn as InvokeInterfaceInstruction;

        iifInsn.count = buffer.readUnsignedByte();
    }

    return invokeInsn as InvokeInstruction;
};

export const writeInvoke = (insn: InvokeInstruction): Instruction => {
    const hasPadding = insn.opcode === Opcode.INVOKEDYNAMIC || insn.opcode === Opcode.INVOKEINTERFACE;

    const buffer = createMutableBuffer(hasPadding ? 4 : 2);
    buffer.writeUnsignedShort(insn.ref);

    if (hasPadding) {
        let neededZeroes = 2;
        if (insn.opcode === Opcode.INVOKEINTERFACE) {
            const iifInsn = insn as InvokeInterfaceInstruction;

            buffer.writeUnsignedByte(iifInsn.count);
            neededZeroes--;
        }

        buffer.writeZero(neededZeroes);
    }

    return { ...insn, operands: buffer.bufferView };
};
