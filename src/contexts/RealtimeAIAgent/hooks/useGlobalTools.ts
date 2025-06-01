import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import navigateTo from "../global-tool-definitions/navigateTo";

const useGlobalTools = ({ realtimeAgent }) => {
  const navigate = useNavigate();

  const navigateToHandler = useCallback(
    ({ arguments: { url, dynamicUrl } }) => {
      navigate(dynamicUrl ? `${dynamicUrl}` : `${url}`);
    },
    [navigate]
  );

  useEffect(() => {
    return realtimeAgent?.registerTools([navigateTo]);
  }, [realtimeAgent]);

  useEffect(() => {
    return realtimeAgent?.onFunctionCall(navigateTo.name, navigateToHandler);
  }, [navigateToHandler, realtimeAgent]);
};

export default useGlobalTools;
