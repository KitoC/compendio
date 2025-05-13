import Page from "@/components/Page";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { paths } from "@/utils/pathHelpers";
import FormBuilder from "@/components/FormBuilder";
import { quoteFormConfig } from "@/forms/quoteForm";
import { useRenderPortal } from "@/hooks/useRenderPortal";

const NewQuote = () => {
  const { urlTenantAlias } = useTenant();
  const navigate = useNavigate();

  const onSubmit = (data: unknown) => {
    console.log(data);
  };

  const renderPortal = useRenderPortal("header-anchor-left");

  return (
    <Page title="Draft quote">
      {renderPortal(
        <Button
          variant="outline"
          onClick={() => navigate(paths.getQuotesPath(urlTenantAlias))}
        >
          <ArrowLeftIcon />
          Back to quotes
        </Button>
      )}

      <FormBuilder
        className="pt-4 h-fit"
        contentClassName="h-fit overflow-y-unset"
        config={quoteFormConfig}
        onSubmit={onSubmit}
        initialValues={{
          name: "",
        }}
      />
    </Page>
  );
};

export default NewQuote;
