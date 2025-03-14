
import { useState, useEffect, useRef } from "react";

interface Command {
  command: string;
  description: string;
}

interface CommandSuggestionsProps {
  commands: Command[];
  onSelect: (command: string) => void;
  filter: string;
  selectedIndex: number;
}

export const CommandSuggestions = ({
  commands,
  onSelect,
  filter,
  selectedIndex,
}: CommandSuggestionsProps) => {
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilteredCommands(
      commands.filter((cmd) =>
        cmd.command.toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [commands, filter]);

  useEffect(() => {
    if (containerRef.current && selectedIndex >= 0) {
      const selectedElement = containerRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
        });
      }
    }
  }, [selectedIndex]);

  if (filteredCommands.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-0 w-full mb-2 bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto z-50" ref={containerRef}>
      {filteredCommands.map((command, index) => (
        <div
          key={command.command}
          className={`px-4 py-2 cursor-pointer hover:bg-accent ${
            index === selectedIndex ? "bg-accent" : ""
          }`}
          onClick={() => onSelect(command.command)}
        >
          <div className="font-semibold">/{command.command}</div>
          <div className="text-sm text-muted-foreground">{command.description}</div>
        </div>
      ))}
    </div>
  );
};
