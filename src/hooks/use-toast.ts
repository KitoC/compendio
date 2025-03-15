
import React from 'react';
import { atom, useAtom, useSetAtom } from 'jotai';
import { useCallback } from 'react';

// Define a type for toast items
type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  duration?: number;
  variant?: 'default' | 'destructive';
};

const toastAtom = atom<ToastItem[]>([]);

// Create a standalone showToast function
let count = 0;
function genId() {
  return `toast-${count++}`;
}

type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  duration?: number;
  variant?: 'default' | 'destructive';
};

// Standalone showToast function that doesn't use React hooks
function showToast({
  id = genId(),
  title,
  description,
  action,
  duration = 3000,
  variant = 'default',
}: ToastProps) {
  return {
    id,
    title,
    description,
    action,
    duration,
    variant,
    promise: new Promise<void>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      let dismiss = () => {};

      function Toast() {
        const { addToast, dismissToast } = useToast();

        dismiss = () => {
          dismissToast(id);
          resolve();
        };

        React.useEffect(() => {
          addToast({
            id,
            title,
            description,
            action,
            duration,
            variant,
          });

          const timer = setTimeout(() => {
            dismissToast(id);
            resolve();
          }, duration);

          return () => {
            clearTimeout(timer);
          };
        }, [id, title, description, action, duration, variant, addToast, dismissToast]);

        return null;
      }

      Toast.displayName = 'Toast';
    }),
  };
}

// Create standalone toast object before useToast to avoid circular references
const toast = {
  success: (message: string, title?: string) => {
    return showToast({
      title: title || "Success",
      description: message,
    });
  },
  error: (message: string, title?: string) => {
    return showToast({
      title: title || "Error",
      description: message,
      variant: "destructive",
    });
  },
  show: (options: Omit<ToastProps, "id">) => {
    return showToast(options);
  }
};

function useToast() {
  const [toasts, setToasts] = useAtom(toastAtom);

  const addToast = useCallback(
    (toast: ToastItem) => {
      setToasts((prevToasts) => [...prevToasts, toast]);
    },
    [setToasts]
  );

  const dismissToast = useCallback(
    (id: string) => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    },
    [setToasts]
  );

  return {
    toasts,
    addToast,
    dismissToast,
    toast, // Include reference to the standalone toast object
  };
}

function useToastAction() {
  return useSetAtom(toastAtom);
}

export { useToast, useToastAction, showToast, toast };
