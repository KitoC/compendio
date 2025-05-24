import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AIQuoteData } from "@/types/quote";
import { toast } from "sonner";

interface AIQuoteAssistantProps {
  onGenerateQuote: (data: AIQuoteData) => void;
  onManualCreate: () => void;
}

export const AIQuoteAssistant = ({
  onGenerateQuote,
  onManualCreate,
}: AIQuoteAssistantProps) => {
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobDescription }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate quote");
      }

      const data: AIQuoteData = await response.json();
      onGenerateQuote(data);
    } catch (e) {
      toast.error("Failed to generate quote. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="space-y-6">
      <CardHeader className="space-y-4">
        <h2 className="text-xl font-semibold">AI Quote Assistant</h2>
        <p className="text-gray-600">
          Describe the job or project, and I'll help you generate a detailed
          quote. You can type your description or use voice input. Say
          punctuation marks like "full stop" or "comma" to add them.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              className="bg-white"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Describe the job or project in detail..."
              rows={6}
              required
            />
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onManualCreate}>
              Create Manually
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate Quote"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
