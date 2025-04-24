import { useContext } from "react";
import { useActionModalContext } from "../ActionModalContext";
import { CustomTablesContext } from "@/contexts/CustomTables/CustomTablesContext";
import { airtableFieldToFormField } from "@/components/airtable-table/utils";
import { AirtableField } from "@/types/airtable";
import FormField from "@/components/form-builder/FormField";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import StepPayloadSelect from "../../StepPayloadSelect";
import { Input } from "@/components/ui/input";
import { FIELD_TYPE_ICONS } from "../../../consts/actions/action_card_info";

export interface FieldMapperField {
  id: string;
  value: string;
  use_ai: boolean;
  name: string;
  type: "expression" | "ai" | "fixed";
}

export interface FieldMapperValue {
  fields: FieldMapperField[];
}

export interface FieldMapperProps {
  value: FieldMapperField[];
  onChange: (value: FieldMapperValue) => void;
}

const FieldMapper = ({ value: values, onChange, name, ...rest }) => {
  const context = useActionModalContext();
  const { tables } = useContext(CustomTablesContext);
  const { action } = context;

  const table = tables.find((table) => table.id === action.metadata.table);

  const fields = table.fields.map((field) =>
    airtableFieldToFormField(field.schema as unknown as AirtableField)
  );

  const onFieldChange = (fieldValue: FieldMapperField) => {
    onChange(
      name,
      values.map((field) => (field.id === fieldValue.id ? fieldValue : field))
    );
  };

  return (
    <div className="space-y-4">
      {values.map((fieldValue) => {
        const { label, ...field } = fields.find(
          (field) => field.id === fieldValue.id
        );

        let fieldMarkup = (
          <FormField
            field={field}
            value={fieldValue.value}
            onChange={(name, value) => {
              onFieldChange({ ...fieldValue, value });
            }}
            formValues={{} as Record<string, unknown>}
            setFormValues={() => {}}
          />
        );

        if (fieldValue.type === "ai") {
          fieldMarkup = (
            <div className="flex items-center gap-2">
              <Input value={"Generated automatically by AI"} disabled />
            </div>
          );
        }

        if (fieldValue.type === "expression") {
          fieldMarkup = (
            <div className="flex items-center gap-2">
              <StepPayloadSelect
                value={fieldValue.value}
                onChange={(value) => {
                  onFieldChange({ ...fieldValue, value });
                }}
                context={context}
                placeholder="Select a field"
              />
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Label>{label}</Label>

              <div className="flex items-center ml-auto gap-2">
                <ToggleGroup
                  variant="default"
                  type="single"
                  size="xs"
                  value={fieldValue.type || "fixed"}
                  onValueChange={(value) =>
                    onFieldChange({ ...fieldValue, type: value, value: "" })
                  }
                >
                  <ToggleGroupItem value="fixed" title="Fixed value">
                    <FIELD_TYPE_ICONS.fixed className="w-4 h-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="expression"
                    title="From previous step"
                  >
                    <FIELD_TYPE_ICONS.expression className="w-4 h-4" />
                  </ToggleGroupItem>

                  <ToggleGroupItem value="ai" title="Generate with AI">
                    <FIELD_TYPE_ICONS.ai className="w-4 h-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full">
              <Button
                variant="ghost"
                size="icon-only"
                onClick={() => {
                  onChange(
                    name,
                    values.filter((field) => field.id !== fieldValue.id)
                  );
                }}
              >
                <X className="w-4 h-4" />
              </Button>

              <div className="w-full">{fieldMarkup}</div>
            </div>
          </div>
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger className="w-fit border-none bg-transparent">
          <Button variant="ghost" size="icon-only">
            <Plus className="w-4 h-4" /> Add Field
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {fields
            .filter(
              (field) =>
                !values.some((fieldValue) => fieldValue.id === field.id)
            )
            .map((field) => (
              <DropdownMenuItem
                key={field.id}
                onClick={() => {
                  onChange(name, [
                    ...values,
                    {
                      id: field.id,
                      name: field.label,
                      value: "",
                      use_ai: false,
                    },
                  ]);
                }}
              >
                {field.label}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FieldMapper;
