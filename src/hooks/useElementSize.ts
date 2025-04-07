// useElementSize.ts
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export function useElementSize<T extends HTMLElement>(
  externalRef: React.RefObject<T>,
  callback?: (size: { width: number; height: number }) => void
) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const updateSize = useCallback(() => {
    if (externalRef.current) {
      const { offsetWidth: width, offsetHeight: height } = externalRef.current;
      setSize({ width, height });
    }
  }, [externalRef]);

  useLayoutEffect(() => {
    if (!externalRef.current) return;

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(externalRef.current);

    setTimeout(() => {
      updateSize();
    }, 350);

    return () => observer.disconnect();
  }, [externalRef, updateSize]);

  useEffect(() => {
    callback?.(size);
  }, [size, callback]);

  return size;
}
