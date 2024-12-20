import { readFileSync } from "node:fs";
import { read } from "../";
import { disassemble, disassembleMethod } from "./disasm";

describe("disassembly", () => {
    const register = (path: string) => {
        it(`disassemble ${path}`, () => {
            const node = read(new Uint8Array(readFileSync(path)));
            console.log(
                disassemble(node, {
                    indent: "    ",
                    fullyQualified: false,
                })
            );

            console.log("----");

            for (const method of node.methods) {
                console.log(
                    disassembleMethod(node, method, {
                        indent: "    ",
                        fullyQualified: false,
                    })
                );
            }
        });
    };

    register("samples/base/sample/string/StringsDummyApp.class");
    register("samples/zkm/sample/string/StringsDummyApp.class");
});
