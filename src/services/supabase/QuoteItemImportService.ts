import { SupabaseFunctionService } from "@/services/supabaseFunctionServices";

export async function uploadQuoteItemsFile({
  file,
  table,
  fileType,
}: {
  file: File;
  table: string;
  fileType: string;
}) {
  const formData = new FormData();

  formData.append("table", table);
  formData.append("fileType", fileType);
  formData.append("file", file);

  const response = await SupabaseFunctionService.post(
    "import-quote-items",
    formData
  );

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }

  return response.json();
}
