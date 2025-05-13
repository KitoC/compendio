import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { FormConfig } from "../types";

interface FormFooterProps {
  config: FormConfig;
  isSubmitting: boolean;
  hasErrors: boolean;
  onReset: () => void;
  onSubmit: () => void;
  onCancel?: () => void;
  hideSubmitButton?: boolean;
  footerClassname?: string;
}

export const FormFooter = ({
  config,
  isSubmitting,
  hasErrors,
  onReset,
  onSubmit,
  onCancel,
  hideSubmitButton,
  footerClassname,
}: FormFooterProps) => {
  return (
    <CardFooter className={`flex justify-between mt-auto ${footerClassname}`}>
      {config.showReset && (
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={isSubmitting}
        >
          {config.resetIconButtonBefore}
          {config.resetButtonText || "Reset"}
          {config.resetIconButtonAfter}
        </Button>
      )}
      <div className="flex gap-2 ml-auto">
        {(config.cancelButtonText || onCancel) && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {config.cancelIconButtonBefore}
            {config.cancelButtonText || "Cancel"}
            {config.cancelIconButtonAfter}
          </Button>
        )}

        {!hideSubmitButton && (
          <Button
            disabled={isSubmitting || hasErrors}
            className={!config.showReset ? "ml-auto" : ""}
            onClick={onSubmit}
          >
            {config.submitIconButtonBefore}
            {isSubmitting
              ? "Submitting..."
              : config.submitButtonText || "Submit"}
            {config.submitIconButtonAfter}
          </Button>
        )}
      </div>
    </CardFooter>
  );
};
