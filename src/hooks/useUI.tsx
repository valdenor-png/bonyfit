import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import ConfirmModal, { ConfirmModalProps } from '../components/ui/ConfirmModal';
import Toast, { ToastType } from '../components/ui/Toast';
import ActionSheet, { ActionSheetOption } from '../components/ui/ActionSheet';
import PromptModal from '../components/ui/PromptModal';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { KeyboardTypeOptions } from 'react-native';

// ─── Types ────────────────────────────────────────────────────
interface ConfirmOptions {
  icon?: 'warning' | 'trash' | 'logout' | 'success' | 'info';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary';
}

interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
}

interface ActionSheetOptions {
  options: ActionSheetOption[];
}

interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  keyboardType?: KeyboardTypeOptions;
}

interface UIContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toast: (config: ToastConfig) => void;
  actionSheet: (options: ActionSheetOptions) => Promise<number>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  loading: { show: (msg?: string) => void; hide: () => void };
}

// ─── Context ──────────────────────────────────────────────────
const UIContext = createContext<UIContextType>({
  confirm: () => Promise.resolve(false),
  toast: () => {},
  actionSheet: () => Promise.resolve(-1),
  prompt: () => Promise.resolve(null),
  loading: { show: () => {}, hide: () => {} },
});

// ─── State types ──────────────────────────────────────────────
interface ConfirmState extends ConfirmOptions {
  visible: boolean;
}

interface ToastState extends ToastConfig {
  visible: boolean;
}

interface ActionSheetState {
  visible: boolean;
  options: ActionSheetOption[];
}

interface PromptState {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  keyboardType?: KeyboardTypeOptions;
}

interface LoadingState {
  visible: boolean;
  message?: string;
}

// ─── Provider ─────────────────────────────────────────────────
export function UIProvider({ children }: { children: React.ReactNode }) {
  // Confirm
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const confirmRef = useRef<((value: boolean) => void) | null>(null);

  // Toast
  const [toastState, setToastState] = useState<ToastState>({ visible: false, type: 'info', title: '' });

  // ActionSheet
  const [actionSheetState, setActionSheetState] = useState<ActionSheetState | null>(null);
  const actionSheetRef = useRef<((value: number) => void) | null>(null);

  // Prompt
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const promptRef = useRef<((value: string | null) => void) | null>(null);

  // Loading
  const [loadingState, setLoadingState] = useState<LoadingState>({ visible: false });

  // ─── Confirm ────────────────────────────────────────────────
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmRef.current = resolve;
      setConfirmState({ ...options, visible: true });
    });
  }, []);

  const handleConfirmConfirm = useCallback(() => {
    setConfirmState(null);
    confirmRef.current?.(true);
    confirmRef.current = null;
  }, []);

  const handleConfirmCancel = useCallback(() => {
    setConfirmState(null);
    confirmRef.current?.(false);
    confirmRef.current = null;
  }, []);

  // ─── Toast ──────────────────────────────────────────────────
  const toast = useCallback((config: ToastConfig) => {
    setToastState({ ...config, visible: true });
  }, []);

  const handleToastDismiss = useCallback(() => {
    setToastState((prev) => ({ ...prev, visible: false }));
  }, []);

  // ─── ActionSheet ────────────────────────────────────────────
  const actionSheet = useCallback((options: ActionSheetOptions): Promise<number> => {
    return new Promise((resolve) => {
      actionSheetRef.current = resolve;
      setActionSheetState({ visible: true, options: options.options });
    });
  }, []);

  const handleActionSheetSelect = useCallback((index: number) => {
    setActionSheetState(null);
    actionSheetRef.current?.(index);
    actionSheetRef.current = null;
  }, []);

  const handleActionSheetCancel = useCallback(() => {
    setActionSheetState(null);
    actionSheetRef.current?.(-1);
    actionSheetRef.current = null;
  }, []);

  // ─── Prompt ─────────────────────────────────────────────────
  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      promptRef.current = resolve;
      setPromptState({ ...options, visible: true });
    });
  }, []);

  const handlePromptConfirm = useCallback((value: string) => {
    setPromptState(null);
    promptRef.current?.(value);
    promptRef.current = null;
  }, []);

  const handlePromptCancel = useCallback(() => {
    setPromptState(null);
    promptRef.current?.(null);
    promptRef.current = null;
  }, []);

  // ─── Loading ────────────────────────────────────────────────
  const loadingShow = useCallback((msg?: string) => setLoadingState({ visible: true, message: msg }), []);
  const loadingHide = useCallback(() => setLoadingState({ visible: false }), []);
  const loading = { show: loadingShow, hide: loadingHide };

  // ─── Context value ─────────────────────────────────────────
  const value: UIContextType = { confirm, toast, actionSheet, prompt, loading };

  return (
    <UIContext.Provider value={value}>
      {children}

      {/* Confirm Modal */}
      {confirmState && (
        <ConfirmModal
          visible={confirmState.visible}
          icon={confirmState.icon}
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          confirmVariant={confirmState.confirmVariant}
          onConfirm={handleConfirmConfirm}
          onCancel={handleConfirmCancel}
        />
      )}

      {/* Toast */}
      <Toast
        visible={toastState.visible}
        type={toastState.type}
        title={toastState.title}
        message={toastState.message}
        onDismiss={handleToastDismiss}
      />

      {/* ActionSheet */}
      {actionSheetState && (
        <ActionSheet
          visible={actionSheetState.visible}
          options={actionSheetState.options}
          onSelect={handleActionSheetSelect}
          onCancel={handleActionSheetCancel}
        />
      )}

      {/* Prompt Modal */}
      {promptState && (
        <PromptModal
          visible={promptState.visible}
          title={promptState.title}
          message={promptState.message}
          placeholder={promptState.placeholder}
          defaultValue={promptState.defaultValue}
          confirmLabel={promptState.confirmLabel}
          keyboardType={promptState.keyboardType}
          onConfirm={handlePromptConfirm}
          onCancel={handlePromptCancel}
        />
      )}

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={loadingState.visible}
        message={loadingState.message}
      />
    </UIContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useUI() {
  return useContext(UIContext);
}
