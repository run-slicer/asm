import { readFileSync, opendirSync, type Dirent } from "node:fs";
import { join } from "node:path";
import { read, write } from "../";
import { removeIllegal } from "./verify";

describe("verification", () => {
    const register = (path: string) => {
        const expected = new Uint8Array(readFileSync(path));
        it(`round-trip ${path}`, () => {
            write(removeIllegal(read(expected)));
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
