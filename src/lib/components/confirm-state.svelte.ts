export interface ConfirmOptions {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

let pending = $state<PendingConfirm | null>(null);

function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    pending = { options, resolve };
  });
}

function respond(value: boolean): void {
  pending?.resolve(value);
  pending = null;
}

export function getConfirmState() {
  return {
    get pending() {
      return pending;
    },
    confirm,
    respond
  };
}
