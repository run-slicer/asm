import { readFileSync } from "node:fs";
import { read } from "../";
import { analyzeReachable } from "./peephole";
import { AttributeType } from "../spec";
import type { CodeAttribute } from "../attr";
import { expect } from "chai";

describe("reachability", () => {
    const register = (path: string, expected: number) => {
        const data = readFileSync(path);
        it(`analyze ${path}`, () => {
            const node = read(data);

            for (const method of node.methods) {
                const attr: CodeAttribute = method.attribute(AttributeType.CODE);
                if (!attr) {
                    continue;
                }

                const offsets = analyzeReachable(attr);

                const unreachable = attr.insns.filter((i) => !offsets.includes(i.offset));
                expect(unreachable.length).equal(expected);
            }
        });
    };

    register("samples/jasm/unreachable/Example.class", 0);
    register("samples/jasm/unreachable/ExampleUnreachable.class", 9); // ASM adds removes dead code, so this removes nops and athrow
});
