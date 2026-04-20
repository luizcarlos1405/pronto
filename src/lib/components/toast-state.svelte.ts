export interface ToastAction {
  label: string;
  fn: () => void | Promise<void>;
}

export interface Toast {
  id: string;
  message: string;
  action?: ToastAction;
}

let toasts = $state<Toast[]>([]);
let timers = $state(new Map<string, ReturnType<typeof setTimeout>>());
const TOAST_LIFETIME = 5000;
const MAX_VISIBLE = 3;

function uid(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function notify(message: string, action?: ToastAction): string {
  const id = uid();
  const next = [...toasts, { id, message, action }];
  if (next.length > MAX_VISIBLE) {
    const oldest = next[0];
    dismiss(oldest.id);
    toasts = next.slice(1);
  } else {
    toasts = next;
  }
  const timer = setTimeout(() => dismiss(id), TOAST_LIFETIME);
  timers.set(id, timer);
  return id;
}

function dismiss(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

export function getToastState() {
  return {
    get toasts() {
      return toasts;
    },
    notify,
    dismiss,
  };
}
