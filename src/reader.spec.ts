import { readFileSync, opendirSync, type Dirent } from "node:fs";
import { join } from "node:path";
import { expect } from "chai";
import type { UTF8Entry } from "./pool";
import { read, write } from "./";

describe("reader", () => {
    it("read samples/zkm/sample/string/StringsLong.class", async () => {
        const expected = readFileSync("samples/zkm/sample/string/StringsLong.class");
        const result = read(expected);

        expect(result.magic).equal(0xcafebabe);

        const name = new TextDecoder().decode((result.pool[result.thisClass.name] as UTF8Entry).data);
        expect(name).equal("sample/string/StringsLong");

        // for (const attribute of result.attributes) {
        //     console.log(new TextDecoder().decode(attribute.name.data));
        // }
    });
});

describe("reader+writer", () => {
    const register = (path: string) => {
        const expected = new Uint8Array(readFileSync(path));
        it(`round-trip ${path}`, () => {
            const result = write(read(expected));

            expect(result).deep.equal(expected);
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
