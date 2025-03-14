import makeSupabaseEntity from "../../utils/makeSupabaseEntity";

export type ConversationRecord = {
  id: string;
  domain: string;
  userId: string;
  thread: object[];
  created_at?: string;
  updated_at?: string;
};

export default makeSupabaseEntity<
  ConversationRecord,
  Partial<ConversationRecord>
>({
  entityName: "conversations",
  primaryKey: "id",
});
