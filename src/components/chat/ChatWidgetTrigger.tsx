
import { useState } from "react";
import { Button } from "../ui/button";
import { MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { ChatWidget } from "./ChatWidget";
import { useIsMobile } from "@/hooks/use-mobile";

export function ChatWidgetTrigger() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg mb-safe-bottom mr-safe-right"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 border-0 max-w-3xl h-[80vh] bg-transparent shadow-none">
        <ChatWidget defaultOpen={true} defaultFullScreen={isMobile} />
      </DialogContent>
    </Dialog>
  );
}
