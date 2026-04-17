declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined
    PRIVATE_KEY?: string
  }
}
