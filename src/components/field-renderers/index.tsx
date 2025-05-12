import React from "react";
import CheckboxRenderer from "./CheckboxRenderer";
import DateRenderer from "./DateRenderer";
import MultiSelectRenderer from "./MultiSelectRenderer";
import SingleSelectRenderer from "./SingleSelectRenderer";
import TextRenderer from "./TextRenderer";
import NumberRenderer from "./NumberRenderer";
import UrlRenderer from "./UrlRenderer";
import AttachmentRenderer from "./AttachmentRenderer";
import EmailRenderer from "./EmailRenderer";
import RatingRenderer from "./RatingRenderer";
import CurrencyRenderer from "./CurrencyRenderer";
import PercentRenderer from "./PercentRenderer";
import PhoneRenderer from "./PhoneRenderer";
import MultipleLookupRenderer from "./MultipleLookupRenderer";
import DefaultRenderer from "./DefaultRenderer";
import EntityRenderer from "./EntityRenderer";
import RollupRenderer from "./RollupRenderer";
import { GridViewColumn } from "@/components/views/GridView/GridView";
import { FieldRenderOptions } from "@/types/fieldTypes";

export interface FieldRendererProps<ValueType, RecordType> {
  field: FieldRenderOptions;
  value: ValueType;
  record?: RecordType;
}

/**
 * Field renderer factory - returns the appropriate renderer component based on field type
 */
export function getFieldRenderer<RecordType>(
  field: FieldRenderOptions,
  value: unknown,
  record: RecordType
): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  switch (field.type) {
    case "boolean":
      return <CheckboxRenderer field={field} value={value} />;
    case "date":
    case "date_time":
      return <DateRenderer field={field} value={value} />;
    case "multiple_select":
      return <MultiSelectRenderer field={field} value={value} />;
    case "single_select":
      return (
        <SingleSelectRenderer field={field} value={value as string | number} />
      );
    case "text":
      return <TextRenderer field={field} value={value} />;
    case "multiple_lookup":
      return <MultipleLookupRenderer field={field} value={value} />;
    case "duration":
      return <NumberRenderer field={field} value={value} />;
    case "url":
      return <UrlRenderer field={field} value={value} />;
    case "file":
      return <AttachmentRenderer field={field} value={value} />;
    case "email":
      return <EmailRenderer field={field} value={value} />;
    case "rating":
      return <RatingRenderer field={field} value={value} />;
    case "currency":
      return <CurrencyRenderer field={field} value={value} />;
    case "percent":
      return <PercentRenderer field={field} value={value} />;
    case "phone":
      return <PhoneRenderer field={field} value={value} />;
    case "link_row":
      return <EntityRenderer field={field} value={value} record={record} />;
    case "rollup":
      return <RollupRenderer field={field} value={value} />;
    default:
      return <DefaultRenderer field={field} value={value} />;
  }
}
