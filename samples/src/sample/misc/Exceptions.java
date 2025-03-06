package sample.misc;

import java.io.IOException;
import java.io.UncheckedIOException;

public class Exceptions {
    public static void main(String[] args) throws Exception {
        throw new Exception();
    }

    public static void checkedIO() throws IOException {
        throw new IOException();
    }

    public static void uncheckedIO() {
        throw new UncheckedIOException(new IOException());
    }

    public static void multipleRandom() throws IOException, ExceptionInInitializerError, UnsupportedOperationException {
        throw new RuntimeException();
    }
}
