
import { useState } from "react";
import { Button } from "../ui/button";
import { MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { ChatWidget } from "./ChatWidget";

export function ChatWidgetTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 border-0 max-w-3xl h-[80vh] bg-transparent shadow-none">
        <ChatWidget defaultOpen={true} />
      </DialogContent>
    </Dialog>
  );
}
