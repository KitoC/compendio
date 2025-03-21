import { SupabaseController } from "locals/controllers/SupabaseController";
import Logger from "locals/utils/Logger";
import { Migration, JsonSchemaPayload } from "locals/dsl/Migration";

interface IConstructorParams {
  logger?: Logger;
}

class TableBuilderController extends SupabaseController {
  public logger: Logger;

  constructor({
    logger = new Logger({ name: "TableBuilderController" }),
  }: IConstructorParams) {
    super({ logger });

    this.logger = logger;
  }

  async generateSchemaFromResponse(schemaContent: string) {
    let parsedSchema;

    this.logger.info("Generating schema from response", schemaContent);

    try {
      parsedSchema = JSON.parse(schemaContent);
    } catch (error) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch =
        schemaContent.match(/```json\n([\s\S]*?)\n```/) ||
        schemaContent.match(/```\n([\s\S]*?)\n```/) ||
        schemaContent.match(/{[\s\S]*}/);

      if (jsonMatch) {
        try {
          parsedSchema = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (innerError) {
          return this.throwError("Failed to parse generated schema", 400);
        }
      } else {
        return this.throwError("Failed to parse generated schema", 400);
      }
    }

    this.logger.info("Parsed schema", parsedSchema);

    return parsedSchema;
  }

  async createAndApplyMigration(schema: JsonSchemaPayload): Promise<{
    insert_custom_tables_response: { data: { [key: string]: string }[] };
  } | void> {
    if (!this.tenant_id) {
      this.throwError("Tenant ID is required to create tables", 400);
      return;
    }

    const migration = await Migration.fromSchemaJson(
      schema,
      this.supabase_AS_SUPER_ADMIN
    );

    return await migration.apply(this.supabase_AS_SUPER_ADMIN, this.tenant_id);
  }

  async importData(records: unknown[]) {
    const { error } = await this.supabase_AS_SUPER_ADMIN.rpc(
      "import_custom_table_data",
      {
        import_data: { records },
        input_tenant_id: this.tenant_id,
      }
    );

    if (error) {
      return this.throwError("Failed to import data", 500, error);
    }

    return true;
  }
}

export { TableBuilderController };
export default new TableBuilderController({
  logger: new Logger({ name: "TableBuilderController" }),
});
