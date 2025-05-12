import { ROUTES } from "@/consts/routes";

export const paths = {
  getNewQuotePath: (tenantId: string) => {
    return ROUTES.QUOTES_NEW.replace(":tenantId", tenantId);
  },
  getQuotesPath: (tenantId: string) => {
    return ROUTES.QUOTES.replace(":tenantId", tenantId);
  },
  getQuotePath: (tenantId: string, quoteId: string) => {
    return ROUTES.QUOTE.replace(":tenantId", tenantId).replace(
      ":quoteId",
      quoteId
    );
  },
};
