import type { CodeAttribute } from "../attr/code";
import type { Instruction } from "../insn";
import { Opcode } from "../spec";
import { createBuffer } from "../buffer";

const readSwitch = (opcode: Opcode, operands: Uint8Array): [number, number[]] => {
    const buffer = createBuffer(operands);

    const defaultOffset = buffer.readInt();
    let jumpOffsets: number[];

    if (opcode === Opcode.TABLESWITCH) {
        const lowCase = buffer.readInt();
        const highCase = buffer.readInt();

        jumpOffsets = new Array<number>(highCase - lowCase + 1);
        for (let i = 0; i < jumpOffsets.length; i++) {
            jumpOffsets[i] = buffer.readInt();
        }
    } else if (opcode === Opcode.LOOKUPSWITCH) {
        const jumpOffsetCount = buffer.readInt();

        jumpOffsets = new Array<number>(jumpOffsetCount);
        for (let i = 0; i < jumpOffsets.length; i++) {
            buffer.readInt(); // case
            jumpOffsets[i] = buffer.readInt();
        }
    } else {
        throw new Error(`Unrecognized switch opcode ${opcode}`);
    }

    return [defaultOffset, jumpOffsets];
};

const reachableInRange = (offsets: Set<number>, start: number, end: number): boolean => {
    for (let offset = start; offset < end; offset++){
        if (offsets.has(offset)) {
            return true;
        }
    }

    return false;
};

const markReachable = (code: Instruction[], offsets: Set<number>, offset: number) => {
    for (const insn of code.filter((i) => i.offset >= offset)) {
        if (offsets.has(insn.offset)) {
            return; // reachable code ahead, abort
        }

        offsets.add(insn.offset);
        switch (insn.opcode) {
            case Opcode.IRETURN:
            case Opcode.LRETURN:
            case Opcode.FRETURN:
            case Opcode.DRETURN:
            case Opcode.ARETURN:
            case Opcode.RETURN:
            case Opcode.ATHROW:
            case Opcode.RET:
                return;
            case Opcode.IFEQ:
            case Opcode.IFNE:
            case Opcode.IFLT:
            case Opcode.IFGE:
            case Opcode.IFGT:
            case Opcode.IFLE:
            case Opcode.IF_ICMPEQ:
            case Opcode.IF_ICMPNE:
            case Opcode.IF_ICMPLT:
            case Opcode.IF_ICMPGE:
            case Opcode.IF_ICMPGT:
            case Opcode.IF_ICMPLE:
            case Opcode.GOTO:
            case Opcode.GOTO_W:
            case Opcode.JSR:
            case Opcode.JSR_W:
            case Opcode.IFNULL:
            case Opcode.IFNONNULL: {
                const buffer = createBuffer(insn.operands);

                let branchOffset: number;
                if (insn.opcode === Opcode.GOTO_W || insn.opcode === Opcode.JSR_W) {
                    branchOffset = buffer.readInt();
                } else {
                    branchOffset = buffer.readShort();
                }

                markReachable(code, offsets, insn.offset + branchOffset);
                if (insn.opcode === Opcode.GOTO || insn.opcode === Opcode.GOTO_W) {
                    return;
                }

                break;
            }
            case Opcode.TABLESWITCH:
            case Opcode.LOOKUPSWITCH: {
                const [defaultOffset, jumpOffsets] = readSwitch(insn.opcode, insn.operands);

                markReachable(code, offsets, insn.offset + defaultOffset);
                for (const jumpOffset of jumpOffsets) {
                    markReachable(code, offsets, insn.offset + jumpOffset);
                }

                return;
            }
        }
    }
};

export const analyzeReachable = (attr: CodeAttribute): number[] => {
    const offsets = new Set<number>();
    markReachable(attr.insns, offsets, 0);

    let handlerReachable: boolean;
    do {
        handlerReachable = false;

        for (const entry of attr.exceptionTable) {
            if (!offsets.has(entry.handlerPC) && reachableInRange(offsets, entry.startPC, entry.endPC)) {
                markReachable(attr.insns, offsets, entry.handlerPC);

                handlerReachable = true;
            }
        }
    } while (handlerReachable);

    return Array.from(offsets);
};
