from os.path import isdir, exists
from sys import stderr


def dir_path(s: str) -> str:
    if isdir(s) or not exists(s):
        return s
    raise NotADirectoryError(s)


def eprint(*args, **kwargs):
    print(*args, file=stderr, **kwargs)
