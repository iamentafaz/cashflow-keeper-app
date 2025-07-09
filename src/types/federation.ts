export interface RemoteAppConfig {
  name: string;
  url: string;
  scope: string;
  module: string;
  displayName: string;
  route: string;
  description?: string;
  icon?: string;
}

export interface FederationConfig {
  remotes: Record<string, RemoteAppConfig>;
}

// Global type for module federation
declare global {
  interface Window {
    [key: string]: {
      get: (module: string) => Promise<() => any>;
      init: (shared: any) => void;
    };
  }
}

export {};