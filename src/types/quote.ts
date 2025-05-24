import { QuoteFormData } from "@/components/quotes/QuoteForm";

export interface AIQuoteLineItem {
  name: string;
  quantity: number;
  unit_price: number;
  description?: string;
}

export interface AIQuoteData {
  name: string;
  description: string;
  quote_line_items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unit_price: number;
  }>;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: "draft" | "sent" | "accepted" | "rejected";
  total?: number;
  tax?: number;
  discount?: number;
  notes?: string;
}

export interface AIQuoteResponse {
  quote: AIQuoteData;
}

export interface AudioTranscriptionResponse {
  transcription: string;
}
