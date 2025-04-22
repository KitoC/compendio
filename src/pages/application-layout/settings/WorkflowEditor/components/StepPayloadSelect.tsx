import Cascader from "@/components/ui/cascader";
import { useCustomTables } from "@/contexts/CustomTables";
import { getTriggerText } from "../consts/triggers";
import { getActionText } from "../consts/actions/action_text";
import { ACTION_TYPES } from "../consts/actions";

const buildOptions = (context) => {
  const { action, workflow, tables } = context;

  const fromTriggerOptions = workflow.triggers.map((trigger, index) => {
    const targetTable = tables.find(
      (table) => table.id === trigger.metadata.table
    );
    const triggerText = getTriggerText(trigger, tables).plainText;

    return {
      label: triggerText,
      value: trigger.id,
      children: targetTable?.fields.map((field) => ({
        label: `${field.schema.name}`,
        valueLabel: `(from trigger ${index + 1}) ${field.schema.name}`,
        value: `triggers.payload.${field.id}`,
        formatValue: (value) => {
          return `[${targetTable.name}] ${value} - from trigger "${triggerText}"`;
        },
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

  const fromActionOptions = workflow.actions
    .filter(
      (wAction) =>
        wAction.id !== action.id &&
        ![ACTION_TYPES.CONDITIONAL].includes(wAction.action_type)
    )
    .map((wfAction) => {
      const table = tables.find(
        (table) => table.id === wfAction.metadata.table
      );
      return {
        label: getActionText(wfAction, tables).plainText,
        value: wfAction.id,
        children: wfAction.metadata.fields.map((field) => ({
          label: field.name,
          value: field.id,
          formatValue: (value) => {
            return `[${table.name}] ${value} - from action "${
              getActionText(action, tables).plainText
            }"`;
          },
        })),
      };
    });

  return [
    { label: "Using data from trigger:", isGroupLabel: true },
    ...fromTriggerOptions,
    { label: "Using data from action:", isGroupLabel: true },
    ...fromActionOptions,
  ];
};

const StepPayloadSelect = ({
  value,
  onChange,
  context,
  placeholder = "Select a field",
}) => {
  const { tables } = useCustomTables();
  const { action, workflow } = context;

  const options = buildOptions({ action, workflow, tables });

  return (
    <Cascader
      value={value?.value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
    />
  );
};

export default StepPayloadSelect;
