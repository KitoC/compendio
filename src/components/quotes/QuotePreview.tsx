import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import { FileText, Pencil, Send } from "lucide-react";
import { format } from "date-fns";
import { QuotePreviewType } from "@/services/supabase/QuoteService";
import Address from "./Address";
import {
  calculateTaxTotal,
  calculateTotal,
  calculateSubtotal,
  calculateDiscountTotal,
} from "./utils/calculations";

interface QuotePreviewProps {
  quote: QuotePreviewType;
  onSaveDraft: () => void;
  onSendQuote: () => void;
  onBack: () => void;
}

const QuotePreview = ({
  quote,
  onSaveDraft,
  onSendQuote,
  onBack,
}: QuotePreviewProps) => {
  const { company, client, staff_member, quote_line_items } = quote;

  const showDiscount = quote_line_items.some(
    (item) => item.discount_amount > 0 || item.discount_percentage > 0
  );

  return (
    <div className="w-full flex justify-center">
      <Card className="max-w-4xl min-w-4xl w-4/5">
        <CardHeader>
          <CardTitle>Quote Preview</CardTitle>
          <CardDescription>
            Review your quote before sending it to the client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-primary">
                  {quote.name || "Untitled Quote"}
                </h2>
                <p className="text-gray-500 mt-1">
                  Quote #{quote.quote_number}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{company.name}</p>
                <Address address={company.address} />
                <p className="text-sm text-gray-500">
                  Phone: {company.contact.phone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-medium text-gray-500 mb-2">Client</h3>
                <p className="font-medium">
                  {client.first_name} {client.last_name}
                </p>
                <Address address={client.address} />
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <h3 className="font-medium text-gray-500">Quote Date</h3>
                  <p>{format(new Date(quote.created_at || ""), "PPP")}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Status</h3>
                  <p className="capitalize">{quote.status}</p>
                </div>
              </div>
            </div>

            <h3 className="font-medium mb-3 border-b pb-2">Job Details</h3>
            <p className="mb-6">
              {quote.description || "No description provided."}
            </p>

            <div className="border rounded-md overflow-hidden mb-8">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Tax</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quote_line_items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">{item.quote_item.name}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        ${item.unit_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.tax_percentage
                          ? `${item.tax_percentage.toFixed(2)}%`
                          : `-`}
                      </td>

                      <td className="px-4 py-3 text-right">
                        ${item.total_price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal:</span>
                  <span>${calculateSubtotal(quote_line_items).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax:</span>
                  <span>${calculateTaxTotal(quote_line_items).toFixed(2)}</span>
                </div>
                {showDiscount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount:</span>
                    <span className="text-destructive">
                      -$
                      {calculateDiscountTotal(quote_line_items).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total:</span>
                  <span>${calculateTotal(quote_line_items).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-medium mb-2">Terms & Conditions</h3>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>Quote is valid for 30 days from the date of issue</li>
                <li>50% deposit required to commence work</li>
                <li>Final payment due upon completion</li>
                <li>
                  Any additional work outside the scope will be quoted
                  separately
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button variant="outline" onClick={onBack} className="mr-2">
              <Pencil className="mr-2 h-4 w-4" /> Edit Quote
            </Button>
          </div>
          <div className="flex ml-auto gap-2">
            <Button variant="outline" onClick={onSaveDraft}>
              <FileText className="mr-2 h-4 w-4" /> Save Draft
            </Button>
            <Button onClick={onSendQuote}>
              <Send className="mr-2 h-4 w-4" /> Send Quote
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuotePreview;
