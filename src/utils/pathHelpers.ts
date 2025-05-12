import { ROUTES } from "@/consts/routes";

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
  getDataNavigationPath: (dataNavigationPath: string, tenantId: string) => {
    return ROUTES.DATA_NAVIGATION.replace(
      ":dataNavigationPath",
      dataNavigationPath
    ).replace(":tenantId", tenantId);
  },
};
