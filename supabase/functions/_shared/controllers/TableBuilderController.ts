import { BaseController } from "locals/controllers/_BaseController";
import { Migration, JsonSchemaPayload } from "locals/dsl/Migration";
import { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";

class TableBuilderController extends BaseController {
  constructor(private req: Request, private context: AuthenticatedContext) {
    super();
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
    if (!this.context.authService.tenantId) {
      this.throwError("Tenant ID is required to create tables", 400);
      return;
    }

    const migration = await Migration.fromSchemaJson(
      schema,
      this.context.supabase_AS_SUPER_ADMIN
    );

    return await migration.apply(
      this.context.supabase_AS_SUPER_ADMIN,
      this.context.authService.tenantId
    );
  }

  async importData(records: unknown[]) {
    const { error } = await this.context.supabase_AS_SUPER_ADMIN.rpc(
      "import_custom_table_data",
      {
        import_data: { records },
        input_tenant_id: this.context.authService.tenantId,
      }
    );

    if (error) {
      return this.throwError("Failed to import data", 500, error);
    }

    return true;
  }
}

export { TableBuilderController };
