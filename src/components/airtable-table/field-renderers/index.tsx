import React from "react";
import { AirtableField } from "@/types/airtable";
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
import DefaultRenderer from "./DefaultRenderer";

export interface FieldRendererProps {
  field: AirtableField;
  value: any;
}

/**
 * Field renderer factory - returns the appropriate renderer component based on field type
 */
export const getFieldRenderer = (
  field: AirtableField,
  value: any
): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">-</span>;
  }

  switch (field.type) {
    case "checkbox":
      return <CheckboxRenderer field={field} value={value} />;
    case "date":
    case "dateTime":
    case "createdTime":
    case "lastModifiedTime":
      return <DateRenderer field={field} value={value} />;
    case "multipleSelects":
      return <MultiSelectRenderer field={field} value={value} />;
    case "singleSelect":
      return <SingleSelectRenderer field={field} value={value} />;
    case "singleLineText":
    case "longText":
    case "autoNumber":
    case "count":
    case "rollup":
    case "formula":
    case "lookup":
      return <TextRenderer field={field} value={value} />;
    case "number":
    case "duration":
      return <NumberRenderer field={field} value={value} />;
    case "url":
      return <UrlRenderer field={field} value={value} />;
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
    case "phoneNumber":
      return <PhoneRenderer field={field} value={value} />;
    default:
      return <DefaultRenderer field={field} value={value} />;
  }
};
