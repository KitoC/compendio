import { useState, ChangeEvent, FormEvent } from "react";
import ResponsiveModal from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { uploadQuoteItemsFile } from "@/services/supabase/QuoteItemImportService";
import { Loader2 } from "lucide-react";

interface QuoteItemsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuoteItemsImportModal({
  isOpen,
  onClose,
  onSuccess,
}: QuoteItemsImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to import.");
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      await uploadQuoteItemsFile({
        file,
        table: "quote_items",
        fileType: file.type,
      });
      onSuccess();
    } catch (err) {
      setError("Failed to import file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ResponsiveModal
      title="Import Quote Items"
      isOpen={isOpen}
      setIsOpen={onClose}
      isSlider
      bodyClassName="!p-0"
      footerClassName="shadow-sm-top z-10"
      footerId="quote-items-import-footer"
      footer={null}
      onOpenAutoFocus={(e) => {
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLElement) {
          activeElement.blur();
        }
      }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <input
          type="file"
          accept="*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        {error && <div className="text-red-500">{error}</div>}
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
