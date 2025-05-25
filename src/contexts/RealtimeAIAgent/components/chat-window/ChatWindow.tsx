import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";
import { X, ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatMessages from "./ChatMessages";

const ChatWindow = ({
  children,
  isOpen,
  toggleOpen,
}: {
  children: ReactNode;
  isOpen: boolean;
  toggleOpen: (isOpen: boolean) => void;
}) => {
  const [isMiniOpen, setIsMiniOpen] = useState(true);

  return (
    <div
      className={cn(
        "rounded-lg  relative group",
        isOpen ? "border border-border bg-white shadow-lg" : "rounded-full"
      )}
    >
      <div
        className={cn(
          "flex flex-col absolute  -right-4 transition-all duration-300 hover:bg-slate-100/50 border border-transparent hover:border-border rounded-md",
          isOpen && "opacity-0",
          isMiniOpen && " h-[300px] w-[300px] -top-[305px]",
          !isMiniOpen && "h-0 w-0 top-4"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between absolute -top-8 right-0 group-hover:opacity-100 opacity-0 transition-all duration-300"
          )}
        >
          <div className="text-sm text-gray-500 ml-auto pt-1 pr-1">
            <Button
              size="icon-only"
              variant="ghost"
              onClick={() => setIsMiniOpen(!isMiniOpen)}
            >
              {isMiniOpen ? <ArrowDownToLine /> : <ArrowUpToLine />}
            </Button>
          </div>
        </div>
        <ChatMessages isOpen={isOpen} />
      </div>

      <div
        className={cn(
          isOpen &&
            "absolute -top-10  w-full flex justify-center pointer-events-none"
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          "flex flex-col transition-all duration-300",
          isOpen ? "h-[500px] w-[400px] opacity-1" : "h-0 w-0 opacity-0"
        )}
      >
        {isOpen && (
          <div className="flex items-center justify-between border-b p-2 px-4">
            <div className="text-lg font-bold">Assistant</div>
            <div className="text-sm text-gray-500">
              <Button variant="ghost" onClick={() => toggleOpen(!isOpen)}>
                <X />
              </Button>
            </div>
          </div>
        )}

        <ChatMessages isOpen={isOpen} />

        {isOpen && (
          <div className="mt-auto w-full border-t border-border p-4">
            footer
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
