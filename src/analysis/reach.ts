import type { CodeAttribute } from "../attr";
import { BranchInstruction, Instruction, SwitchInstruction } from "../insn";
import { Opcode } from "../spec";

const reachableInRange = (offsets: Set<number>, start: number, end: number): boolean => {
    for (let offset = start; offset < end; offset++) {
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
            case Opcode.IF_ACMPEQ:
            case Opcode.IF_ACMPNE:
            case Opcode.GOTO:
            case Opcode.GOTO_W:
            case Opcode.JSR:
            case Opcode.JSR_W:
            case Opcode.IFNULL:
            case Opcode.IFNONNULL: {
                const { branchOffset } = insn as BranchInstruction;

                markReachable(code, offsets, insn.offset + branchOffset);
                if (insn.opcode === Opcode.GOTO || insn.opcode === Opcode.GOTO_W) {
                    return;
                }

                break;
            }
            case Opcode.TABLESWITCH:
            case Opcode.LOOKUPSWITCH: {
                const { defaultOffset, jumpOffsets } = insn as SwitchInstruction;

                markReachable(code, offsets, insn.offset + defaultOffset);
                for (const jumpOffset of jumpOffsets) {
                    markReachable(code, offsets, insn.offset + jumpOffset);
                }

                return;
            }
        }
    }
};

export const scanReachable = (attr: CodeAttribute): number[] => {
    // TODO: use graph
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

export const removeUnreachable = (attr: CodeAttribute): CodeAttribute => {
    const offsets = scanReachable(attr);
    if (offsets.length === attr.insns.length) {
        return attr; // everything is reachable
    }

    const insns: Instruction[] = [];
    for (let i = 0; i < attr.insns.length; i++) {
        const insn = attr.insns[i];
        if (!offsets.includes(insn.offset)) {
            // not reachable

            const nextInsn = attr.insns[i + 1];
            for (let j = 0; j < insn.length; j++) {
                let opcode = Opcode.NOP;
                if (insn.length - 1 === j /* last index */ && !nextInsn) {
                    opcode = Opcode.ATHROW; // execution fell off, throw
                }

                insns.push({
                    opcode,
                    operands: new Uint8Array(0),
                    offset: insn.offset + j,
                    length: 1,
                    dirty: false,
                });
            }
        } else {
            insns.push(insn);
        }
    }

    return { ...attr, insns, dirty: true };
};
