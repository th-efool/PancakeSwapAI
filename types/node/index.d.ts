declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    PRIVATE_KEY?: string;
  }

  interface Process {
    env: ProcessEnv;
  }
}

declare var process: NodeJS.Process;

declare module 'fs' {
  const fs: {
    writeFileSync(path: string, data: string): void;
  };

  export default fs;
}
