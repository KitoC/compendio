import { Tool } from "../types";

export interface NavigateToParams {
  url: string;
  dynamicUrl?: string;
}

export interface GlobalTool extends Tool {
  handler?: (params: { data: NavigateToParams }) => void;
}
