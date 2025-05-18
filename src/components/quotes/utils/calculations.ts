import { QuoteLineItem } from "@/services/supabase/QuoteLineItemService";

export const calculateDiscount = (
  lineItem: Partial<QuoteLineItem>,
  itemSubtotal: number
) => {
  if (lineItem.discount_amount) {
    return lineItem.discount_amount;
  }

  if (lineItem.discount_percentage) {
    const discount = itemSubtotal * (lineItem.discount_percentage / 100);
    console.log("discount", discount);
    return discount;
  }

  return 0;
};

export const calculateTax = (
  itemSubtotal: number,
  taxPercentage: number = 0
) => {
  return itemSubtotal * (taxPercentage / 100);
};

export const calculateLineItemAmount = (lineItem: Partial<QuoteLineItem>) => {
  const subtotal = lineItem.quantity * lineItem.unit_price;

  return subtotal;
};

export const calculateSubtotal = (lineItems: Partial<QuoteLineItem>[]) => {
  return lineItems.reduce(
    (acc, item) => acc + calculateLineItemAmount(item),
    0
  );
};

export const calculateTaxTotal = (lineItems: Partial<QuoteLineItem>[]) => {
  return lineItems.reduce((acc, item) => {
    const amount = calculateLineItemAmount(item);
    const discount = calculateDiscount(item, amount);
    const tax = calculateTax(amount - discount, item?.tax_percentage || 0);

    return acc + tax;
  }, 0);
};

export const calculateDiscountTotal = (lineItems: Partial<QuoteLineItem>[]) => {
  return lineItems.reduce((acc, item) => {
    const amount = calculateLineItemAmount(item);
    const discount = calculateDiscount(item, amount);
    console.log("lineItem", item);
    console.log("discount", discount);
    return acc + discount;
  }, 0);
};

export const calculateTotal = (lineItems: Partial<QuoteLineItem>[]) => {
  const subtotal = calculateSubtotal(lineItems);
  const discount = calculateDiscountTotal(lineItems);
  const tax = calculateTaxTotal(lineItems);

  console.log("subtotal", subtotal);
  console.log("discount", discount);
  console.log("tax", tax);

  return subtotal - discount + tax;
};
