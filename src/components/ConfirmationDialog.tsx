import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onConfirmText: string;
  onConfirmLoading: boolean;
  disabled: boolean;
}

const ConfirmationDialog = ({
  isOpen,
  onClose,
  title,
  description,
  onConfirm,
  onConfirmText,
}: ConfirmationDialogProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="animate-fade-in">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isConfirming}
            onClick={(e) => {
              e.stopPropagation();
              setIsConfirming(false);
              onClose();
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isConfirming}
            onClick={async (e) => {
              e.stopPropagation();
              setIsConfirming(true);
              await onConfirm();
              setIsConfirming(false);
            }}
          >
            {isConfirming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              onConfirmText || "Confirm"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog;
