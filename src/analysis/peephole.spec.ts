import { readFileSync } from "node:fs";
import { read } from "../index";
import { analyzeReachable } from "./peephole";
import { AttributeType } from "../spec";
import type { CodeAttribute } from "../attr/code";
import { expect } from "chai";

describe("reachability", () => {
    const register = (path: string, expected: number) => {
        const data = readFileSync(path);
        it(`analyze ${path}`, () => {
            const node = read(data);

            for (const method of node.methods) {
                const attr = method.attribute<CodeAttribute>(AttributeType.CODE);
                if (!attr) {
                    continue;
                }

                const offsets = analyzeReachable(attr);

                const unreachable = attr.insns.filter((i) => !offsets.includes(i.offset));
                console.log(unreachable);
                expect(unreachable.length).equal(expected);
            }
        });
    };

    register("samples/jasm/unreachable/Example.class", 0);
    register("samples/jasm/unreachable/ExampleUnreachable.class", 9); // ASM adds removes dead code, so this removes nops and athrow
});
