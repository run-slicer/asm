import { expect } from "chai";
import { readFileSync } from "node:fs";
import { read } from "../";
import type { CodeAttribute } from "../attr";
import { AttributeType } from "../spec";
import { scanReachable } from "./reach";

describe("reachability", () => {
    const register = (path: string, expected: number) => {
        const data = readFileSync(path);
        it(`scan ${path}`, () => {
            const node = read(data);

            for (const method of node.methods) {
                const attr = method.attrs.find((a) => a.type === AttributeType.CODE);
                if (!attr) {
                    continue;
                }

                const code = attr as CodeAttribute;
                const offsets = scanReachable(code);

                const unreachable = code.insns.filter((i) => !offsets.includes(i.offset));
                expect(unreachable.length).equal(expected);
            }
        });
    };

    register("samples/jasm/unreachable/Example.class", 0);
    register("samples/jasm/unreachable/ExampleUnreachable.class", 9);
});
