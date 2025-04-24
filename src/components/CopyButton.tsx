import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Copy } from "lucide-react";

export const CopyToClipboardButton = ({
  value,
  className,
}: {
  value: unknown;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [copied]);

  return (
    <Button
      className={className}
      onClick={() => {
        navigator.clipboard.writeText(value as string);
        setCopied(true);
      }}
    >
      <Copy className="w-4 h-4" />
      {copied ? "Copied" : "Copy"}
    </Button>
  );
};
