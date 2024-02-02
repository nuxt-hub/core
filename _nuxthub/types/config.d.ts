declare interface Config {
  oauth?: {
    [key: string]: {
      clientId?: string
      clientSecret?: string
    }
  },
  public?: {
    features?: object
  }
}
