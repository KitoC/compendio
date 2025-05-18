import Page from "@/components/Page";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { paths } from "@/utils/pathHelpers";
import FormBuilder from "@/components/FormBuilder";
import { quoteFormConfig } from "@/forms/quoteForm";
import { useRenderPortal } from "@/hooks/useRenderPortal";
import { Quote, QuotePreviewType } from "@/services/supabase/QuoteService";
import { useState } from "react";
import QuotePreview from "@/components/quotes/QuotePreview";

const mockQuotePreview: QuotePreviewType = {
  id: "1",
  name: "Mock Quote",
  quote_number: "0001",
  description: "This is a mock quote",
  status: "draft",
  client_id: "1",
  created_at: "2021-01-01",
  deleted_at: null,
  staff_member_id: "1",
  tenant_id: "1",
  updated_at: "2021-01-01",
  company: {
    id: "1",
    name: "Mock Company",
    created_at: "2021-01-01",
    contact: {
      id: "1",
      phone: "123-456-7890",
      email: "mockcompany@example.com",
    },
    address: {
      id: "1",
      address_line_1: "123 Main St",
      address_line_2: "Apt 1",
      city: "Anytown",
      state: "CA",
      zip: "12345",
      country: "USA",
    },
  },
  staff_member: {
    id: "1",
    first_name: "John",
    last_name: "Smith",
    email: "john.smith@example.com",
    phone: "123-456-7890",
  },
  client: {
    id: "1",
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "123-456-7890",
    created_at: "2021-01-01",
    deleted_at: null,
    contact: {
      id: "1",
      email: "john.doe@example.com",
      phone: "123-456-7890",
    },
    address: {
      id: "1",
      address_line_1: "123 Main St",
      address_line_2: "Apt 1",
      city: "Anytown",
      state: "CA",
      zip: "12345",
      country: "USA",
    },
  },
  quote_line_items: [
    {
      id: "1",
      quote_item: {
        id: "1",
        name: "Mock Quote Item",
      },
      created_at: "2021-01-01",
      quote_id: "1",
      quote_item_id: "1",
      quantity: 1,
      unit_price: 100,
      total_price: 100,
      tax_percentage: 10,
      discount_amount: 0,
      discount_percentage: 0,
    },
    {
      id: "2",
      quote_item: {
        id: "2",
        name: "Mock Quote Item 2",
      },
      created_at: "2021-01-01",
      deleted_at: null,
      tenant_id: "1",
      updated_at: "2021-01-01",
      quote_id: "1",
      quote_item_id: "2",
      quantity: 2,
      unit_price: 200,
      total_price: 400,
      discount_amount: 100,
      tax_percentage: 10,
    },
  ],
};

const NewQuote = () => {
  const { urlTenantAlias } = useTenant();
  const navigate = useNavigate();

  const [quotePreview, setQuotePreview] = useState<QuotePreviewType | null>(
    null
  );

  const onSubmit = (data: unknown) => {
    console.log(data);
    setQuotePreview(mockQuotePreview);
  };

  const renderPortal = useRenderPortal("header-anchor-left");

  return (
    <Page title={quotePreview ? "" : "New quote"}>
      {renderPortal(
        <Button
          variant="outline"
          onClick={() => navigate(paths.getQuotesPath(urlTenantAlias))}
        >
          <ArrowLeftIcon />
          Back to quotes
        </Button>
      )}

      {quotePreview && (
        <QuotePreview
          quote={quotePreview}
          onSaveDraft={() => setQuotePreview(null)}
          onSendQuote={() => setQuotePreview(null)}
          onBack={() => setQuotePreview(null)}
        />
      )}

      {!quotePreview && (
        <FormBuilder
          className="pt-4 h-fit"
          contentClassName="h-fit overflow-y-unset"
          config={quoteFormConfig}
          onSubmit={onSubmit}
          initialValues={{
            name: "My new quote",
          }}
        />
      )}
    </Page>
  );
};

export default NewQuote;
