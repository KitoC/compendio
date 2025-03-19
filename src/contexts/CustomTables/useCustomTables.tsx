import { useContext } from "react";
import { CustomTablesContext } from "./CustomTablesContext";

export const useCustomTables = () => {
  const context = useContext(CustomTablesContext);
  if (!context) {
    throw new Error(
      "useCustomTables must be used within a CustomTablesProvider"
    );
  }
  return context;
};
