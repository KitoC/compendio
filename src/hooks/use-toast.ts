
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

  // Create toast methods
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
    // Added a more generic method for other toast scenarios
    show: (options: Omit<ToastProps, "id">) => {
      return showToast(options);
    }
  };

  return {
    toasts,
    addToast,
    dismissToast,
    toast, // Include toast methods
  };
}

function useToastAction() {
  return useSetAtom(toastAtom);
}

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

// Export standalone toast functions for direct import
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

export { useToast, useToastAction, showToast, toast };
