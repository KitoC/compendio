import { FC } from "react";
import type { OptionCardType } from "./types";
import clsx from "clsx";

interface OptionCardProps {
  option: OptionCardType;
  onSelect: () => void;
  isSelected: boolean;
}

const OptionCard: FC<OptionCardProps> = ({ option, onSelect, isSelected }) => (
  <button
    onClick={onSelect}
    className={clsx(
      "w-full p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg bg-white group",
      { "!border-indigo-500": isSelected }
    )}
  >
    <div className="flex gap-4">
      {option.imgUrl && (
        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={option.imgUrl}
            alt={option.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}
      <div className="flex-1 flex flex-col text-left gap-2">
        <h3
          className={clsx(
            "font-semibold text-gray-700 group-hover:text-gray-900 m-0 transition-all duration-200",
            { "!text-indigo-500": isSelected }
          )}
        >
          {option.name}
        </h3>
        <p className="text-sm text-gray-600  m-0">{option.description}</p>
        <div className="flex flex-wrap gap-2">
          {option?.tags?.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full 
                       text-xs font-medium bg-indigo-50 text-indigo-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  </button>
);

export default OptionCard;
