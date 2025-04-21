import Cascader from "@/components/ui/cascader";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

const RightSideInput = ({ value, onChange, context }) => {
  const isSingleSelect = value?.leftValue?.data?.fieldType === "singleSelect";

  const options = value?.leftValue?.data?.schema?.options?.choices.map(
    (choice) => ({
      label: choice.name,
      value: choice.id,
    })
  );

  useEffect(() => {
    if (isSingleSelect && !value.rightValue && options?.[0]) {
      onChange({
        ...value,
        rightValue: options[0],
      });
    }
  }, [isSingleSelect, value, onChange, options]);

  if (isSingleSelect) {
    return (
      <Cascader
        options={options || []}
        value={value.rightValue?.value}
        onChange={(rightValue) => onChange({ ...value, rightValue })}
      />
    );
  }

  return (
    <Input
      value={value.rightValue?.value}
      onChange={(e) =>
        onChange({
          ...value,
          rightValue: { value: e.target.value, data: value.rightValue.data },
        })
      }
    />
  );
};

export default RightSideInput;
