import React from "react";
import { CustomTableField, SelectOption } from "@/types/customTable";
import type { CustomTableRecord } from "@/types/customTable";
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

export interface FieldRendererProps<V = unknown> {
  field: CustomTableField;
  value: V;
  record?: CustomTableRecord;
}

/**
 * Field renderer factory - returns the appropriate renderer component based on field type
 */
export const getFieldRenderer = (
  field: CustomTableField,
  value: unknown,
  record: CustomTableRecord
): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  switch (field.type) {
    case "checkbox":
    case "boolean":
      return <CheckboxRenderer field={field} value={value} />;
    case "date":
    case "dateTime":
    case "createdTime":
    case "created_on":
    case "last_modified":
    case "lastModifiedTime":
      return <DateRenderer field={field} value={value} />;
    case "multipleSelects":
    case "multiple_select":
      return <MultiSelectRenderer field={field} value={value} />;
    case "singleSelect":
    case "single_select":
      return (
        <SingleSelectRenderer field={field} value={value as string | number} />
      );
    case "singleLineText":
    case "text":
    case "longText":
    case "long_text":
    case "autoNumber":
    case "count":
    case "formula":
    case "lookup":
    case "aiText":
      return <TextRenderer field={field} value={value} />;
    case "multipleLookupValues":
      return <MultipleLookupRenderer field={field} value={value} />;
    case "number":
    case "duration":
      return <NumberRenderer field={field} value={value} />;
    case "url":
      return <UrlRenderer field={field} value={value} />;
    case "file":
    case "multipleAttachments":
    case "attachment":
      return <AttachmentRenderer field={field} value={value} />;
    case "email":
      return <EmailRenderer field={field} value={value} />;
    case "rating":
      return <RatingRenderer field={field} value={value} />;
    case "currency":
      return <CurrencyRenderer field={field} value={value} />;
    case "percent":
      return <PercentRenderer field={field} value={value} />;
    case "phone_number":
    case "phoneNumber":
      return <PhoneRenderer field={field} value={value} />;
    case "multipleRecordLinks":
    case "link_row":
      return <EntityRenderer field={field} value={value} record={record} />;
    case "rollup":
      return <RollupRenderer field={field} value={value} />;
    default:
      return <DefaultRenderer field={field} value={value} />;
  }
};
