declare namespace Javy {
  namespace IO {
    function readSync(fd: number, buffer: Uint8Array): number;
    function writeSync(fd: number, buffer: Uint8Array): void;
  }
}
