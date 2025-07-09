import type { RemoteAppConfig } from "@/types/federation";

export class FederationLoader {
  private static loadedRemotes = new Set<string>();

  static async loadRemoteApp(config: RemoteAppConfig): Promise<void> {
    if (this.loadedRemotes.has(config.name)) {
      return;
    }

    try {
      // Load the remote entry script
      const script = document.createElement('script');
      script.src = config.url;
      script.async = true;
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load remote app: ${config.name}`));
        document.head.appendChild(script);
      });

      // Initialize the remote app
      const container = (window as any)[config.scope];
      if (!container) {
        throw new Error(`Remote container "${config.scope}" not found`);
      }

      await container.init({
        react: () => import('react'),
        'react-dom': () => import('react-dom'),
        'react-router-dom': () => import('react-router-dom'),
      });

      this.loadedRemotes.add(config.name);
    } catch (error) {
      console.error(`Failed to load remote app ${config.name}:`, error);
      throw error;
    }
  }

  static async getRemoteModule<T = any>(appName: string, moduleName: string): Promise<T> {
    const container = (window as any)[appName];
    if (!container) {
      throw new Error(`Remote app "${appName}" not loaded`);
    }

    const factory = await container.get(moduleName);
    const module = factory();
    return module;
  }

  static isRemoteLoaded(appName: string): boolean {
    return this.loadedRemotes.has(appName);
  }
}