// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  interface Window {
    addSampleData?: () => Promise<{
      inboxItems: number;
      goals: number;
      tasks: number;
      cares: number;
    }>;
  }
}

export {};
