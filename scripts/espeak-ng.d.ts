declare module "espeak-ng" {
  export default function ESpeakNg(options: {
    arguments: string[];
  }): Promise<{
    FS: {
      readFile: (path: string) => Uint8Array;
    };
  }>;
}
