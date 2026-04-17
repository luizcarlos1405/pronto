declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

declare module 'virtual:pwa-info' {
  export interface PwaInfo {
    webManifest: {
      href: string;
      linkTag: string;
    };
    needRefresh: boolean;
    offlineReady: boolean;
    updateServiceWorker: () => boolean;
  }
  export const pwaInfo: PwaInfo | undefined;
}
