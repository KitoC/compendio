import {
  QuoteItem,
  QuoteItemService,
} from "@/services/supabase/QuoteItemService";

import { CustomFieldComponentProps } from "@/components/FormBuilder/types";

import EntitySelect from "../EntitySelect/EntitySelect";

const quoteItemService = new QuoteItemService();

interface QuoteItemSelectProps extends CustomFieldComponentProps {
  isMulti: boolean;
}
const QuoteItemSelect = (props: QuoteItemSelectProps) => {
  return (
    <EntitySelect
      {...props}
      renderLabel={(record: QuoteItem) => `${record.name} (${record.code})`}
      isMulti={false}
      tableName={quoteItemService.tableName}
      uniqueKey={quoteItemService.primaryKey}
      id="quote-item-select"
      onFetch={(query) => {
        return quoteItemService.get(query);
      }}
      placeholder={"Search for quote items"}
    />
  );
};

export default QuoteItemSelect;
