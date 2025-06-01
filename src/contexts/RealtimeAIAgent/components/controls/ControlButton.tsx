import { Button } from "@/components/ui/button";
import React from "react";

interface ControlButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  isListening?: boolean;
  isVisible?: boolean;
  tooltip: string;
}

const ControlButton = ({ icon, onClick, tooltip }: ControlButtonProps) => {
  return (
    <div className="group relative">
      <Button
        onClick={onClick}
        className="bg-stone-600 hover:bg-stone-700 shadow-md text-lime-500 hover:text-lime-500 border-lime-500 hover:border-lime-500"
        title={tooltip}
        round
        variant="outline-primary"
      >
        {icon}
      </Button>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {tooltip}
      </div>
    </div>
  );
};

export default ControlButton;
