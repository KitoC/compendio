import { ROUTES } from "@/lib/constants";

export const paths = {
  getDataNavigationViewPath: (
    dataViewAlias: string,
    dataNavigationPath: string,
    tenantId: string
  ) => {
    return ROUTES.DATA_NAVIGATION_VIEW.replace(":dataViewAlias", dataViewAlias)
      .replace(":dataNavigationPath", dataNavigationPath)
      .replace(":tenantId", tenantId);
  },
};
