import Cascader, { CascaderOption } from "@/components/ui/cascader";
import { useCustomTables } from "@/contexts/CustomTables";
import { getTriggerText, TRIGGER_TYPES } from "../../../consts/triggers";
import { AIRTABLE_OPERATORS } from "./OperatorSelect";

const buildOptions = (context) => {
  const { action, workflow, tables } = context;

  const fromTriggerOptions = workflow.triggers.map((trigger) => {
    const targetTable = tables.find(
      (table) => table.id === trigger.metadata.table
    );

    if (trigger.metadata.type === "airtable") {
      return {
        label: getTriggerText(trigger, tables).plainText,
        value: trigger.id,
        children: targetTable?.fields
          ?.filter((field) => AIRTABLE_OPERATORS[field.schema.type])
          .map((field) => ({
            label: `${field.schema.name}`,
            value: field.id,
            data: {
              type: "airtable",
              triggerId: trigger.id,
              parentValue: trigger.id,
              tableId: targetTable.id,
              fieldId: field.id,
              fieldType: field.schema.type,
              schema: field.schema,
            },
          })),
      };
    }

    if (trigger.event_type === TRIGGER_TYPES.WEBHOOK_RECEIVED) {
      const payload = trigger.metadata.payload;
      let children = [];

      const extractFieldsRecursively = (data, parentKey = "") => {
        const options = [];

        Object.entries(data).map(([key, dataValue]) => {
          const value = `${parentKey ? `${parentKey}.` : ""}${key}`;
          const type = Array.isArray(dataValue) ? "list" : typeof dataValue;

          if (Array.isArray(dataValue) && dataValue.length > 0) {
            options.push({
              label: value.split(".").join(" -> "),
              value,
              secondaryLabel: type,
              // children: extractFieldsRecursively(dataValue[0], value),
              data: { type },
            });
          } else if (type === "object") {
            options.push({
              label: value.split(".").join(" -> "),
              value,
              secondaryLabel: type,
              children: extractFieldsRecursively(dataValue, value),
              data: { type },
            });
          } else {
            options.push({
              label: value.split(".").join(" -> "),
              value,
              secondaryLabel: type,
              data: { type },
            });
          }
        });

        return options;
      };

      if (payload) {
        children = extractFieldsRecursively(payload);
      }

      return {
        label: getTriggerText(trigger, tables).plainText,
        value: trigger.id,
        children,
      };
    }

    return {
      label: getTriggerText(trigger, tables).plainText,
      value: trigger.id,
    };
  });

  return [
    { label: "From triggers:", isGroupLabel: true },
    ...fromTriggerOptions,
  ];
};

const LeftSideSelect = ({ value, onChange, context }) => {
  const { tables } = useCustomTables();
  const { action, workflow } = context;
  const options = buildOptions({ action, workflow, tables });

  return (
    <Cascader
      value={value?.leftValue?.value}
      onChange={(leftValue) => {
        onChange({ ...value, leftValue });
      }}
      options={options}
    />
  );
};

export default LeftSideSelect;
