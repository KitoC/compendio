import { createContext, useContext } from "react";

const ActionModalContext = createContext({});

export const useActionModalContext = () => {
  return useContext(ActionModalContext);
};

export default ActionModalContext;
