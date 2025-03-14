import { FC } from "react";
import { Command } from "../../constants/commands";

interface CommandSuggestionsProps {
  commands: Command[];
  onSelect: (command: string) => void;
  filter: string;
  selectedIndex: number;
}

const CommandSuggestions: FC<CommandSuggestionsProps> = ({
  commands,
  onSelect,
  filter,
  selectedIndex,
}) => {
  const filteredCommands = commands.filter((cmd) =>
    cmd.command.toLowerCase().includes(filter.toLowerCase())
  );

  if (filteredCommands.length === 0) return null;

  return (
    <div className="absolute bottom-full mb-2 w-full max-w-md bg-white/70 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 overflow-hidden">
      {filteredCommands.map((cmd, index) => (
        <button
          key={cmd.command}
          onClick={() => onSelect(cmd.command)}
          className={`w-full px-4 py-2 text-left flex justify-between items-center group transition-colors duration-200
            ${
              index === selectedIndex
                ? "bg-indigo-500/10 text-indigo-700"
                : "hover:bg-white/50"
            }`}
        >
          <span
            className={`font-mono ${
              index === selectedIndex
                ? "text-indigo-700"
                : "text-indigo-600 group-hover:text-indigo-700"
            }`}
          >
            /{cmd.command}
          </span>
          <span className="text-sm text-gray-500">{cmd.description}</span>
        </button>
      ))}
    </div>
  );
};

export default CommandSuggestions;
