import { WSSContext } from "locals/middleware/_getSharedServices";
import { PublicContext } from "locals/middleware/withPublicContext";
import { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";

export type Context = WSSContext | PublicContext | AuthenticatedContext;

export * from "./User";
