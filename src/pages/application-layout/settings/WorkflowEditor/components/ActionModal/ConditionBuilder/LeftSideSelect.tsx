import Cascader, { CascaderOption } from "@/components/ui/cascader";
import { useCustomTables } from "@/contexts/CustomTables";
import { getTriggerText } from "../../../consts/triggers";
import { AIRTABLE_OPERATORS } from "./OperatorSelect";

const buildOptions = (context) => {
  const { action, workflow, tables } = context;

  const fromTriggerOptions = workflow.triggers.map((trigger) => {
    const targetTable = tables.find(
      (table) => table.id === trigger.metadata.table
    );

    return {
      label: getTriggerText(trigger, tables).plainText,
      value: trigger.id,
      children: targetTable.fields
        .filter((field) => AIRTABLE_OPERATORS[field.schema.type])
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
