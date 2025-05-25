import { useNavigate } from "react-router-dom";
import navigateTo from "../global-tool-definitions/navigateTo";
import { useTenant } from "@/contexts/TenantContext";
import { keyBy } from "lodash";

const useGlobalTools = () => {
  const navigate = useNavigate();
  const { urlTenantAlias } = useTenant();

  const navigateToHandler = ({ url }: { url: string }) => {
    navigate(`/${urlTenantAlias}/app${url}`);
  };

  const globalTools = {
    tools: keyBy([navigateTo], "name"),
    handlers: {
      navigateTo: navigateToHandler,
    },
  };

  return globalTools;
};

export default useGlobalTools;
