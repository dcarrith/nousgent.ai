import { useEffect } from 'react';

export interface CopyCommandButtonProps {
  readonly targetId: string;
  readonly label?: string;
}

let copyListenersBound = false;
let lastCopyMessage = '';
const copyTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

function reportCopyResult(button: HTMLElement, ok: boolean): void {
  const tip = button.nextElementSibling as HTMLElement | null;
  const iconEl = button.querySelector<HTMLElement>('[data-copy-icon]');
  const existing = copyTimers.get(button);
  if (existing) clearTimeout(existing);
  button.removeAttribute('data-copied');
  button.removeAttribute('data-failed');

  let message = ok ? 'Copied' : 'Copy failed';
  if (message === lastCopyMessage) {
    message += '\u00A0';
  }
  lastCopyMessage = message;

  if (iconEl) iconEl.textContent = ok ? '✓' : '✕';
  if (tip) tip.textContent = '';
  void button.offsetWidth;
  button.setAttribute(ok ? 'data-copied' : 'data-failed', '');
  if (tip) {
    requestAnimationFrame(() => {
      tip.textContent = message;
    });
  }
  copyTimers.set(
    button,
    setTimeout(() => {
      button.removeAttribute('data-copied');
      button.removeAttribute('data-failed');
      if (iconEl) iconEl.textContent = '⎘';
      if (tip) tip.textContent = '';
    }, 2000)
  );
}

async function performClipboardCopy(button: HTMLElement, target: HTMLElement): Promise<void> {
  const text =
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
      ? target.value.trim()
      : (target.innerText || target.textContent || '').trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    reportCopyResult(button, true);
  } catch {
    reportCopyResult(button, false);
  }
}

function bindGlobalInvokerCopyOnce(): void {
  if (copyListenersBound || typeof window === 'undefined' || typeof document === 'undefined') return;
  copyListenersBound = true;

  if ('CommandEvent' in window) {
    document.addEventListener(
      'command',
      (evt: Event) => {
        const cmdEvt = evt as Event & { command?: string; source?: HTMLElement };
        if (cmdEvt.command && cmdEvt.command.startsWith('--copy') && cmdEvt.source && evt.target instanceof HTMLElement) {
          void performClipboardCopy(cmdEvt.source, evt.target);
        }
      },
      true
    );
  } else {
    document.addEventListener('click', (evt: MouseEvent) => {
      const targetEl = evt.target as HTMLElement | null;
      const button = targetEl ? targetEl.closest<HTMLButtonElement>('button[command^="--copy"]') : null;
      if (!button) return;
      const forId = button.getAttribute('commandfor');
      const target = forId ? document.getElementById(forId) : null;
      if (target) {
        void performClipboardCopy(button, target);
      }
    });
  }
}

export function CopyCommandButton({ targetId, label = 'COPY' }: Readonly<CopyCommandButtonProps>) {
  useEffect(() => {
    bindGlobalInvokerCopyOnce();
  }, []);

  return (
    <span className="copy-wrap">
      <button
        type="button"
        className="copy-btn"
        {...({ command: '--copy', commandfor: targetId } as Record<string, string>)}
      >
        <span data-copy-icon aria-hidden="true" style={{ marginRight: '0.3rem' }}>
          ⎘
        </span>
        {label}
      </button>
      <span className="copy-tip" role="status" />
    </span>
  );
}
