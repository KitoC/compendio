import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { ROLES } from "locals/services/AuthService";
import OpenAIController from "locals/controllers/OpenAIController";
import type { OpenAiRole } from "../../../src/types/chat.js";
import { TableBuilderController } from "locals/controllers/TableBuilderController";
import type { JsonSchemaPayload } from "locals/dsl/Migration";
import { withAuthenticatedContext } from "locals/middleware/withAuthenticatedContext";
import { withOriginGuardedRequestHandler } from "locals/middleware/withRequestHandlers";
import { withErrorBoundary } from "locals/middleware/withErrorBoundary";
import type { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";

const PROMPT_FOR_TABLE_CREATION_V2 = `
You are TableSmart, an AI assistant specialized in designing database schemas for business applications.
Your role is to return a schema definition compatible with a Migration DSL that creates custom tables, fields, and relationships for a multi-tenant system.

🧠 Guidelines:
1. Carefully analyze the user's requirements and determine the key entities they need to store.
2. For each entity, define a table with appropriate fields (field_type, description, uniqueness, etc).
3. Identify and define the relationships between tables (one-to-one, one-to-many, many-to-many).
4. For field_type, only use: text, textarea, number, boolean, date, email, url, select, or relation.
5. Suggest appropriate select options where applicable.
6. Never include built-in fields like id, tenant_id, created_at, updated_at, or deleted_at — these are handled automatically.
7. Use snake_case for all table and field names, and Title Case for display_name values.
8. Do not suggest custom foreign key fields manually — use relation type and let the DSL handle it.
9. When applicable, add basic field validation such as minLength, maxLength, min, max, or regex (e.g. for email or phone number formats).
10. Output must be valid JSON using the following structure:

{
  "schema": {
    "tables": [
      {
        "name": "snake_case_table_name",
        "display_name": "Title Case Table Name",
        "description": "Brief description of the table",
        "fields": [
          {
            "name": "snake_case_field_name",
            "display_name": "Title Case Field Name",
            "description": "What this field stores",
            "field_type": "text|textarea|number|boolean|date|email|url|select|relation",
            "required": true|false,
            "unique": true|false,
            "default_value": "optional",
            "options": ["optional", "for select fields only"],
            "validation": { "optional": "rules like minLength, maxLength, regex, etc" }
          }
        ]
      }
    ],
    "relationships": [
      {
        "from_table": "source_table",
        "from_field": "source_relation_field",
        "to_table": "target_table",
        "to_field": "target_primary_field",
        "relationship_type": "one-to-one|one-to-many|many-to-many"
      }
    ]
  },
  "explanation": "Explain your design choices clearly and concisely."
}

💡 Example Use Case:
A user may ask you to track customer quotes, projects, and products for a fencing business.
You should identify: customers, quotes, projects, and products as tables, define fields per table, and establish relevant relationships (e.g. customer has many quotes).

Always respond with the JSON schema only, no extra commentary.
`;

const schemaData = {
  tables: [
    {
      name: "contacts",
      display_name: "Contacts",
      description: "List of contacts",
      fields: [
        {
          name: "email",
          display_name: "Email",
          field_type: "email",
          description: "Primary contact email",
          required: true,
          unique: true,
          default_value: null,
          options: [],
        },
      ],
    },
  ],
  relationships: [],
  explanation: "Contacts belong to accounts...",
};

const callAgent = async (
  prompt: string,
  options?: { response_format?: { type: string } }
) => {
  const response = await OpenAIController.callOpenAIChatCompletion({
    messages: [
      {
        role: "system" as OpenAiRole,
        content: PROMPT_FOR_TABLE_CREATION_V2,
      },
      { role: "user" as OpenAiRole, content: prompt },
    ],
    stream: false,
    options,
  });

  const data = await response.json();

  return data.choices[0].message.content;
};

interface File {
  name: string;
  content: string;
}

// Function to process file content and extract schema information
async function analyzeFilesForSchema(files: File[]) {
  // Create a prompt for the AI based on file contents
  let fileAnalysisPrompt =
    "I have the following data files that need to be imported into a database:\n\n";

  for (const file of files) {
    fileAnalysisPrompt += `File: ${file.name}\n`;
    fileAnalysisPrompt += `Content sample: ${file.content.substring(
      0,
      1000
    )}...\n\n`;
  }

  fileAnalysisPrompt +=
    "\nBased on these files, please design an appropriate database schema with tables, fields, and relationships.";

  // Call the AI with the file analysis prompt
  const schemaResponse = await callAgent(fileAnalysisPrompt);
  return schemaResponse;
}

// Function to process file content and transform it into records for insertion
async function prepareDataForImport(
  files: File[],
  schema: JsonSchemaPayload["schema"]
) {
  // This would parse the files based on the schema and prepare data for import
  // For now, we'll just use a placeholder implementation
  const importData: Record<string, unknown[]> = {};

  for (const table of schema.tables) {
    importData[table.name] = [];
  }

  // We'll ask the AI to help transform the file data into the schema
  let dataTransformPrompt =
    "I need to transform the following data files into records for the database schema:\n\n";

  for (const file of files) {
    dataTransformPrompt += `File: ${file.name}\n`;
    dataTransformPrompt += `Content sample: ${file.content.substring(
      0,
      1000
    )}...\n\n`;
  }

  dataTransformPrompt += "Here's the schema I'll be importing into:\n";
  dataTransformPrompt += JSON.stringify(schema, null, 2);
  dataTransformPrompt +=
    "\n\nPlease transform the data into JSON records that match this schema, grouped by table name.";

  const dataResponse = await callAgent(dataTransformPrompt, {
    response_format: { type: "json_object" },
  });

  try {
    // We're expecting the AI to return a JSON structure with table data
    return JSON.parse(dataResponse);
  } catch (error) {
    console.error("Error parsing data transformation response:", error);
    throw new Error("Failed to prepare data for import");
  }
}

const tableBuilderHandler = async (
  req: Request,
  context: AuthenticatedContext
) => {
  const { authService } = context;
  const { action, prompt, files, schema } = await req.json();

  const tableBuilderController = new TableBuilderController(req, context);

  authService.allowedRoles([ROLES.TENANT_OWNER, ROLES.SUPER_ADMIN]);

  if (!authService.tenantId) {
    authService.throwError("Tenant ID is required to create tables", 400);
  }

  tableBuilderController.logger.info("action", action);

  switch (action) {
    case "generate_schema": {
      // TODO: Add streaming at some point.
      // Generate schema based on prompt
      const schemaContent = await callAgent(prompt);

      const parsedSchema =
        await tableBuilderController.generateSchemaFromResponse(schemaContent);

      return {
        body: JSON.stringify(parsedSchema),
        headers: { "Content-Type": "application/json" },
        status: 200,
      };
    }

    case "create_tables": {
      if (!schema || !schema.tables || !Array.isArray(schema.tables)) {
        tableBuilderController.throwError("Invalid schema provided", 400);
      }

      const response = await tableBuilderController.createAndApplyMigration({
        schema,
      });

      if (!response?.insert_custom_tables_response) {
        tableBuilderController.throwError("Failed to create tables", 500);
      }

      const table_ids = response!.insert_custom_tables_response.data.map(
        (table: { [key: string]: string }) => Object.values(table)[0]
      );

      return {
        body: JSON.stringify({ success: true, response, table_ids }),
        headers: { "Content-Type": "application/json" },
        status: 200,
      };
    }

    case "analyze_files": {
      if (!files || !Array.isArray(files) || files.length === 0) {
        tableBuilderController.throwError("No files provided", 400);
      }

      const schema = await analyzeFilesForSchema(files);
      let parsedSchema;

      try {
        parsedSchema = JSON.parse(schema);
      } catch (error) {
        // If parsing fails, try to extract JSON from the response
        const jsonMatch =
          schema.match(/```json\n([\s\S]*?)\n```/) ||
          schema.match(/```\n([\s\S]*?)\n```/) ||
          schema.match(/{[\s\S]*}/);

        if (jsonMatch) {
          try {
            parsedSchema = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          } catch (innerError) {
            tableBuilderController.throwError(
              "Failed to parse file analysis",
              400
            );
          }
        } else {
          tableBuilderController.throwError(
            "Failed to parse file analysis",
            400
          );
        }
      }

      return {
        body: JSON.stringify(parsedSchema),
        headers: { "Content-Type": "application/json" },
        status: 200,
      };
    }

    case "import_data": {
      if (!schema || !schema.tables || !Array.isArray(schema.tables)) {
        tableBuilderController.throwError("Invalid schema provided", 400);
      }

      if (!files || !Array.isArray(files) || files.length === 0) {
        tableBuilderController.throwError("No files provided", 400);
      }

      // First create the tables
      const response = await tableBuilderController.createAndApplyMigration({
        schema,
      });

      if (!response?.insert_custom_tables_response) {
        tableBuilderController.throwError("Failed to create tables", 500);
      }

      const table_ids = response!.insert_custom_tables_response.data;

      // Then prepare and import the data
      const importData = await prepareDataForImport(files, schema);

      const records: {
        table_id: string;
        table_name: string;
        data: unknown;
      }[] = [];

      table_ids.forEach((table_id_and_name: { [key: string]: string }) => {
        const table_name = Object.keys(table_id_and_name)[0];
        const table_id = Object.values(table_id_and_name)[0];

        records.push(
          ...importData[table_name].map((record: unknown) => ({
            table_id,
            table_name,
            data: record,
          }))
        );
      });

      const importResults = await tableBuilderController.importData(records);

      return {
        body: JSON.stringify({
          success: true,
          table_ids,
          import_results: importResults,
          message: `Created ${
            Object.keys(table_ids).length
          } tables and imported data`,
        }),
        headers: { "Content-Type": "application/json" },
        status: 200,
      };
    }
  }

  return {
    body: JSON.stringify({ success: true }),
    headers: { "Content-Type": "application/json" },
    status: 200,
  };
};

serve(
  withErrorBoundary(
    withAuthenticatedContext(
      withOriginGuardedRequestHandler<AuthenticatedContext>()(
        tableBuilderHandler
      )
    )
  )
);
