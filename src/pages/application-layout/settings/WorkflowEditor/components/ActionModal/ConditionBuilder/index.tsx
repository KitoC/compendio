import { Input } from "@/components/ui/input";

import { Workflow, WorkflowAction } from "@/types/workflows";
import OperatorSelect from "./OperatorSelect";
import LeftSideSelect from "./LeftSideSelect";
import RightSideInput from "./RightSideInput";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";
import { useActionModalContext } from "../ActionModalContext";

const ConditionInput = ({ value, onChange, context, onRemove }) => {
  return (
    <div className="flex gap-2 w-full items-center" key={value.id}>
      {onRemove && (
        <Button variant="ghost" size="icon-only" onClick={onRemove}>
          <X className="w-4 h-4" />
        </Button>
      )}
      <LeftSideSelect value={value} onChange={onChange} context={context} />

      <OperatorSelect value={value} onChange={onChange} context={context} />

      <RightSideInput value={value} onChange={onChange} context={context} />
    </div>
  );
};

export interface Condition {
  id: string;
  leftValue: string;
  operator: string;
  rightValue: string;
}

interface ConditionBuilderProps {
  value: Condition[];
  onChange: (name: string, value: Condition[]) => void;
  name: string;
  formValues: Record<string, unknown>;
  setFormValues: (values: Record<string, unknown>) => void;
}

export const ConditionBuilder = ({
  value,
  onChange,
  name,
  formValues,
  setFormValues,
}: ConditionBuilderProps) => {
  const context = useActionModalContext();

  return (
    <div className="flex flex-col items-start gap-2">
      {value.map((condition, index) => (
        <div key={condition.id} className="flex flex-col gap-4 w-full">
          {index === 1 && (
            <Select
              value={formValues.andOrValue as string}
              onValueChange={(value) => {
                setFormValues({ ...formValues, andOrValue: value });
              }}
            >
              <SelectTrigger className="w-[80px] mt-2 uppercase text-primary border-primary bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          )}
          {index > 1 && (
            <p className="text-sm mt-2 uppercase text-primary ml-3">
              {formValues.andOrValue as string}
            </p>
          )}

          <ConditionInput
            key={condition.id}
            value={condition}
            context={context}
            onChange={(conditionValue) => {
              const newConditions = [...value];
              newConditions[index] = conditionValue;
              onChange(name, newConditions);
            }}
            onRemove={
              index > 0 &&
              (() => {
                onChange(
                  name,
                  value.filter((_, i) => i !== index)
                );
              })
            }
          />
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          onChange(name, [
            ...value,
            { id: uuidv4(), leftValue: "", operator: "", rightValue: "" },
          ]);
        }}
      >
        <Plus className="w-4 h-4" />
        Add Condition
      </Button>
    </div>
  );
};
