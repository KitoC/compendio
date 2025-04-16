import { WSSContext } from "@/middleware/_getSharedServices";
import { PublicContext } from "@/middleware/withPublicContext";
import { AuthenticatedContext } from "@/middleware/withAuthenticatedContext";

export type Context = WSSContext | PublicContext | AuthenticatedContext;

export * from "./User";
