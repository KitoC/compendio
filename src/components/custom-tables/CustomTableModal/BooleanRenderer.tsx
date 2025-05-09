import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const BooleanRenderer = ({ value }: { value: boolean }) => {
  return value ? (
    <Badge className="text-xs w-fit" variant="outline-success">
      <Check className="w-4 h-4 text-green-500" />
    </Badge>
  ) : (
    <Badge className="text-xs w-fit" variant="outline-error">
      <X className="w-4 h-4 text-red-500" />
    </Badge>
  );
};

export default BooleanRenderer;
