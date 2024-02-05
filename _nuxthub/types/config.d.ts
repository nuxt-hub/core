declare interface HubConfig {
  oauth: {
    redirect: string
    [key: string]: {
      clientId?: string
      clientSecret?: string
    }
  },
  /**
   * Configuration exposed to the Vue part
   */
  public: {}
}
