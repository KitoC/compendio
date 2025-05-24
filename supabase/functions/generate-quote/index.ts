import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestData {
  jobDescription: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { jobDescription } = (await req.json()) as RequestData;

    if (!jobDescription) {
      throw new Error("Job description is required");
    }

    const prompt = `Based on the following job description, generate a detailed quote with line items. Format the response as a JSON object with the following structure:
    {
      "name": "Project Name",
      "description": "Detailed project description",
      "quote_line_items": [
        {
          "name": "Item name",
          "description": "Item description",
          "quantity": number,
          "unit_price": number
        }
      ]
    }

    Job Description: ${jobDescription}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a professional quote generator. Generate detailed and accurate quotes based on job descriptions.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate quote");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the response to ensure it's valid JSON
    const quoteData = JSON.parse(content);

    return new Response(JSON.stringify(quoteData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
