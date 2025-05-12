import { FileTextIcon, ListIcon } from "lucide-react";
import { TabRouter } from "@/components/TabRouter";
import { ROUTES } from "@/consts/routes";
import { useTenant } from "@/contexts/TenantContext";
import Page from "@/components/Page";

export const QuotesIndex = () => {
  const routes = [
    {
      id: "quotes",
      label: "Quotes",
      icon: FileTextIcon,
      path: "",
    },
    {
      id: "quote-items",
      label: "Quote Items",
      icon: ListIcon,
      path: ROUTES.QUOTE_ITEMS,
    },
  ];

  return (
    <Page title="Quotes" subtitle="Manage your quotes and quote items">
      <TabRouter routes={routes} />
    </Page>
  );
};
