import type {
  CustomBaseSchema,
  CustomTableRecord,
  CustomTableSchema,
} from "@/types/customTable";

export interface ICustomTableSource {
  base_id: string;
  getBase(tenant_id: string): Promise<CustomBaseSchema>;
  listRecords(table: CustomTableSchema): Promise<CustomTableRecord[]>;
  retrieveRecord(
    table: CustomTableSchema,
    recordId: string
  ): Promise<CustomTableRecord>;
  createRecord(
    table: CustomTableSchema,
    record: CustomTableRecord
  ): Promise<CustomTableRecord>;
  updateRecord(
    table: CustomTableSchema,
    recordId: string,
    record: CustomTableRecord
  ): Promise<CustomTableRecord>;
  deleteRecord(table: CustomTableSchema, recordId: string): Promise<void>;
}
