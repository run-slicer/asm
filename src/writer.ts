import type { Closeable, UTFData } from "./reader";

export interface OutStream extends Closeable {
    bytes(v: Uint8Array): Promise<void>;
}

export interface Writer extends OutStream {
    integer(v: number): Promise<void>;
    long(v: bigint): Promise<void>;
    short(v: number): Promise<void>;
    byte(v: number): Promise<void>;
    utf(v: UTFData): Promise<void>;
}

const writeInt = (stream: OutStream, v: number): Promise<void> => {
    return stream.bytes(new Uint8Array([
        (v >>> 24) & 0xFF,
        (v >>> 16) & 0xFF,
        (v >>> 8) & 0xFF,
        (v >>> 0) & 0xFF,
    ]));
};

const writeLong = (stream: OutStream, v: bigint): Promise<void> => {
    return stream.bytes(new Uint8Array([
        Number(v >> 56n),
        Number(v >> 48n),
        Number(v >> 40n),
        Number(v >> 32n),
        Number(v >> 24n),
        Number(v >> 16n),
        Number(v >> 8n),
        Number(v >> 0n),
    ]));
};

const writeShort = async (stream: OutStream, v: number): Promise<void> => {
    return stream.bytes(new Uint8Array([
        (v >>> 8) & 0xFF,
        (v >>> 0) & 0xFF,
    ]))
};

const writeByte = async (stream: OutStream, v: number): Promise<void> => {
    return stream.bytes(new Uint8Array([v]));
};

const writeUTF = async (stream: OutStream, v: UTFData) => {
    await writeShort(stream, v.length);
    await stream.bytes(v.data);
};

const createInternal = (stream: OutStream): Writer => {
    return {
        ...stream,
        integer: (v) => writeInt(stream, v),
        long: (v) => writeLong(stream, v),
        short: (v) => writeShort(stream, v),
        byte: (v) => writeByte(stream, v),
        utf: (v) => writeUTF(stream, v),
    };
};

export const fromWritableStream = (s: WritableStream<Uint8Array>): Writer => {
    const writer = s.getWriter();

    return createInternal({
        close: () => s.close(),
        bytes: (v) => writer.write(v),
    });
};

export const fromByteArray = (b: Uint8Array): Writer => {
    return createInternal({
        close: () => Promise.resolve(),
        bytes: async (v) => b.set(v, b.length),
    });
};
