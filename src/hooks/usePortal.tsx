import { useEffect } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";

export const useRenderPortal = (id: string) => {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTimeout(() => {
      const element = document.getElementById(id);

      if (element) {
        setPortalEl(element);
      }
    }, 100);
  }, [id]);

  return (children: React.ReactNode) =>
    portalEl && createPortal(children, portalEl);
};
