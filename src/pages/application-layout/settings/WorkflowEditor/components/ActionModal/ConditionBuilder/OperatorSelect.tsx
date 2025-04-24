import Cascader, { CascaderOption } from "@/components/ui/cascader";
import {
  CaseSensitiveIcon,
  HashIcon,
  CalendarIcon,
  SquareCheckIcon,
  ListIcon,
  BoxIcon,
} from "lucide-react";
import { useEffect } from "react";

const OPERATORS = {
  string: ["equals", "not equals", "contains", "does not contain"],
  number: ["equals", "not equals", "greater than", "less than"],
  dateTime: ["equals", "not equals", "greater than", "less than"],
  boolean: ["equals", "not equals"],
  array: ["contains", "does not contain"],
  object: ["equals", "not equals"],
};

const toOption = (operator: string, type: string) => ({
  label: operator,
  value: operator,
  data: {
    type,
  },
});

const OPERATOR_GROUPS: Record<string, CascaderOption> = {
  string: {
    label: "String",
    value: "string",
    Icon: CaseSensitiveIcon,
    children: OPERATORS.string.map((op) => toOption(op, "string")),
  },
  number: {
    label: "Number",
    value: "number",
    Icon: HashIcon,
    children: OPERATORS.number.map((op) => toOption(op, "number")),
  },
  dateTime: {
    label: "Date and Time",
    value: "dateTime",
    Icon: CalendarIcon,
    children: OPERATORS.dateTime.map((op) => toOption(op, "dateTime")),
  },
  boolean: {
    label: "Boolean",
    value: "boolean",
    Icon: SquareCheckIcon,
    children: OPERATORS.boolean.map((op) => toOption(op, "boolean")),
  },
  array: {
    label: "Array",
    value: "array",
    Icon: ListIcon,
    children: OPERATORS.array.map((op) => toOption(op, "array")),
  },
  object: {
    label: "Object",
    value: "object",
    Icon: BoxIcon,
    children: OPERATORS.object.map((op) => toOption(op, "object")),
  },
};

export const AIRTABLE_OPERATORS = {
  singleLineText: ["equals", "not equals", "contains", "does not contain"],
  multilineText: ["equals", "not equals", "contains", "does not contain"],
  longText: ["equals", "not equals", "contains", "does not contain"],
  aiText: ["equals", "not equals", "contains", "does not contain"],
  url: ["equals", "not equals"],
  richText: ["equals", "not equals"],
  singleSelect: ["equals", "not equals"],
  multipleSelects: ["equals", "not equals"],
  multipleLookupValues: ["equals", "not equals"],
  rollup: ["equals", "not equals"],
  createdTime: ["equals", "not equals"],
  lastModifiedTime: ["equals", "not equals"],
  createdBy: ["equals", "not equals"],
  lastModifiedBy: ["equals", "not equals"],
};

const OperatorSelect = ({ value, onChange, context }) => {
  let options = Object.values(OPERATOR_GROUPS);

  if (value.leftValue?.data?.fieldType) {
    options = AIRTABLE_OPERATORS[value.leftValue.data.fieldType].map((op) =>
      toOption(op, value.leftValue.data.fieldType)
    );
  }

  useEffect(() => {
    if (!value.operator && value.leftValue?.data?.fieldType) {
      onChange({ ...value, operator: options[0] });
    }
  }, [value.operator, options, onChange, value]);

  return (
    <Cascader
      disabled={!value.leftValue}
      value={value?.operator?.value}
      onChange={(operator) => onChange({ ...value, operator })}
      options={options}
    />
  );
};

export default OperatorSelect;
