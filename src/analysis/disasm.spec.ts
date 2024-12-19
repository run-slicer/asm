import { readFileSync } from "node:fs";
import { read } from "../";
import { disassemble } from "./disasm";

describe("disassembly", () => {
    const register = (path: string) => {
        it(`disassemble ${path}`, () => {
            const { code /*, references*/ } = disassemble(
                read(new Uint8Array(readFileSync(path))) /*, {
                indent: "    ",
                fullyQualified: true,
            }*/
            );
            console.log(code);
            // console.log(`[${references.join(", ")}]`);
        });
    };

    register("samples/base/sample/string/StringsDummyApp.class");
});
