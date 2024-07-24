export interface Closeable {
    close(): Promise<void>;
}

export interface InStream extends Closeable {
    skip(n: number): Promise<void>;
    bytes(n: number): Promise<Uint8Array>;
}

export interface UTFData {
    length: number;
    data: Uint8Array;

    string(): string;
}

export interface Reader extends InStream {
    integer(): Promise<number>;
    long(): Promise<bigint>;
    unsignedShort(): Promise<number>;
    unsignedByte(): Promise<number>;
    utf(): Promise<UTFData>;
}

const readInt = async (stream: InStream): Promise<number> => {
    const buffer = await stream.bytes(4);

    return (buffer[0] << 24) + (buffer[1] << 16) + (buffer[2] << 8) + (buffer[3] << 0);
};

const readLong = async (stream: InStream): Promise<bigint> => {
    const buffer = await stream.bytes(8);

    return (
        (BigInt(buffer[0]) << 56n) +
        (BigInt(buffer[1] & 255) << 48n) +
        (BigInt(buffer[2] & 255) << 40n) +
        (BigInt(buffer[3] & 255) << 32n) +
        (BigInt(buffer[4] & 255) << 24n) +
        (BigInt(buffer[5] & 255) << 16n) +
        (BigInt(buffer[6] & 255) << 8n) +
        (BigInt(buffer[7] & 255) << 0n)
    );
};

const readUnsignedShort = async (stream: InStream): Promise<number> => {
    const buffer = await stream.bytes(2);

    return (buffer[0] << 8) + (buffer[1] << 0);
};

const readUnsignedByte = async (stream: InStream): Promise<number> => {
    return (await stream.bytes(1))[0];
};

const readUTF = async (stream: InStream): Promise<UTFData> => {
    const length = await readUnsignedShort(stream);
    const data = await stream.bytes(length);

    return {
        length,
        data,
        string: () => {
            let value = "";
            for (let i = 0; i < length; i++) {
                value += String.fromCharCode(data[i]);
            }

            return value;
        },
    };
};

const createInternal = (stream: InStream): Reader => {
    return {
        ...stream,
        integer: () => readInt(stream),
        long: () => readLong(stream),
        unsignedShort: () => readUnsignedShort(stream),
        unsignedByte: () => readUnsignedByte(stream),
        utf: () => readUTF(stream),
    };
};

interface RSReaderContext {
    stream: ReadableStreamDefaultReader<Uint8Array>;
    buffer: Uint8Array;
    offset: number;
}

const skipRS = async (reader: RSReaderContext, n: number) => {
    let read = 0;
    while (read < n) {
        if (reader.offset >= reader.buffer.length) {
            const { done, value } = await reader.stream.read();
            if (done || !value) {
                throw new Error("End of stream");
            }

            reader.buffer = value;
            reader.offset = 0;
        }

        const needed = Math.min(reader.buffer.length - reader.offset, n - read);

        reader.offset += needed;
        read += needed;
    }
};

const readRS = async (reader: RSReaderContext, n: number): Promise<Uint8Array> => {
    const result = new Uint8Array(n);

    let read = 0;
    while (read < n) {
        if (reader.offset >= reader.buffer.length) {
            const { done, value } = await reader.stream.read();
            if (done || !value) {
                throw new Error("End of stream");
            }

            reader.buffer = value;
            reader.offset = 0;
        }

        const available = reader.buffer.length - reader.offset;
        const needed = Math.min(available, n - read);

        result.set(reader.buffer.subarray(reader.offset, reader.offset + needed), read);

        reader.offset += needed;
        read += needed;
    }

    return result;
};

export const fromReadableStream = (s: ReadableStream<Uint8Array>): Reader => {
    const reader: RSReaderContext = {
        stream: s.getReader(),
        buffer: new Uint8Array(0),
        offset: 0,
    };

    return createInternal({
        close: () => s.cancel(),
        skip: (n) => skipRS(reader, n),
        bytes: (n) => readRS(reader, n),
    });
};

interface BAReaderContext {
    data: Uint8Array;
    offset: number;
}

const skipBA = async (reader: BAReaderContext, n: number) => {
    reader.offset += n;
};

const readBA = async (reader: BAReaderContext, n: number): Promise<Uint8Array> => {
    reader.offset += n;
    return reader.data.subarray(reader.offset - n, reader.offset);
};

export const fromByteArray = (b: Uint8Array): Reader => {
    const reader: BAReaderContext = {
        data: b,
        offset: 0,
    };

    return createInternal({
        close: () => Promise.resolve(),
        skip: (n) => skipBA(reader, n),
        bytes: (n) => readBA(reader, n),
    });
};
