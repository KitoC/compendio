import { Location } from "react-router-dom";

export const isOnBoardingRoute = (location: Location) => {
  return location.pathname.match(/^\/([^/]+)\/app\/onboarding$/);
};
