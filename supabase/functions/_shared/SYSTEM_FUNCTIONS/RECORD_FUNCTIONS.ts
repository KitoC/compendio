export const get_records = {
  name: "get_records",
  type: "function",
  description:
    "Get multiple records from a specified Airtable table using filterByFormula syntax.",
  parameters: {
    type: "object",
    required: ["table_name"],
    additionalProperties: false,
    properties: {
      table_name: {
        type: "string",
        description:
          "Name of the table to get the records from. Example: 'orders'",
      },
      filter_formula: {
        type: "string",
        description:
          "Airtable filterByFormula to filter records. Example: `AND({status} = 'open', {priority} = 'high')`",
      },
      limit: {
        type: "number",
        description:
          "Optional. Maximum number of records to return. Defaults to 10.",
      },
      offset: {
        type: "number",
        description: "Optional. Number of records to skip. Defaults to 0.",
      },
    },
  },
  id: "GET_RECORDS",
  tenant_id: "system",
  config: {},
  enabled_for: [],
  schema: {},
  deleted_at: null,
  metadata: {
    // TODO: Make this a background task
    // is_background_task: true,
  },
};

export const RECORD_FUNCTIONS = [get_records];
