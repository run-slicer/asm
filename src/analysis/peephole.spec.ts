import { type Dirent, opendirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { read } from "../index";
import { analyzeReachable } from "./peephole";
import { AttributeType } from "../spec";
import type { CodeAttribute } from "../attr/code";

describe("reachability", () => {
    const register = (path: string) => {
        const expected = readFileSync(path);
        it(`analyze ${path}`, () => {
            const node = read(expected);

            for (const method of node.methods) {
                const name = method.name.decode() + method.type.decode();

                const attr = method.attribute(AttributeType.CODE);
                if (!attr) {
                    continue;
                }

                const code = attr as CodeAttribute;
                const offsets = analyzeReachable(code);

                const unreachable = code.insns.filter((i) => !offsets.includes(i.offset));
                console.log(`removed ${unreachable.length} unreachable instructions from method ${name}`);
            }
        });
    };

    const walk = (path: string) => {
        const dir = opendirSync(path);

        let entry: Dirent | null;
        while ((entry = dir.readSync()) !== null) {
            const childPath = join(path, entry.name);

            if (entry.isFile() && entry.name.endsWith(".class")) {
                register(childPath);
            } else if (entry.isDirectory()) {
                walk(childPath);
            }
        }

        dir.closeSync();
    };

    walk("./samples");
});
