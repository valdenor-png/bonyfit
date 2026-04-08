import React, { createContext, useContext, useRef, useState } from 'react';
import ConfirmModal from '../components/ui/ConfirmModal';

// ─── Types ────────────────────────────────────────────────────
interface ConfirmOptions {
  icon?: 'warning' | 'trash' | 'logout' | 'success' | 'info';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary';
}

interface ConfirmState extends ConfirmOptions {
  visible: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ─── Context ──────────────────────────────────────────────────
const ConfirmContext = createContext<ConfirmContextValue>({
  confirm: () => Promise.resolve(false),
});

// ─── Provider ─────────────────────────────────────────────────
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, visible: true });
    });
  };

  const handleConfirm = () => {
    setState(null);
    resolveRef.current?.(true);
    resolveRef.current = null;
  };

  const handleCancel = () => {
    setState(null);
    resolveRef.current?.(false);
    resolveRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <ConfirmModal
          visible={state.visible}
          icon={state.icon}
          title={state.title}
          message={state.message}
          confirmLabel={state.confirmLabel}
          cancelLabel={state.cancelLabel}
          confirmVariant={state.confirmVariant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useConfirm() {
  return useContext(ConfirmContext);
}
