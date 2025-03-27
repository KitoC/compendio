// NO_CHANGE

import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "locals/services/_BaseSupabaseService";

class MessagesService extends BaseSupabaseService {
  constructor(public req: Request, public context: BaseRequiredContext) {
    super(context);
    this.tableName = "messages";
  }
}

export { MessagesService };
