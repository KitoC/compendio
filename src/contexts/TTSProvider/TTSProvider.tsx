import { useMemo } from "react";
import { TTSContext } from "./TTSContext";
import { useTTSPlayback } from "./useTTSPlayback";

const TTSProvider = ({ children }: { children: React.ReactNode }) => {
  const ttsPlayback = useTTSPlayback();

  const value = useMemo(() => ttsPlayback, [ttsPlayback]);

  return <TTSContext.Provider value={value}>{children}</TTSContext.Provider>;
};

export default TTSProvider;
