import { cn } from "@/lib/utils";
import "./SpeakingAnimation.css";

interface SpeakingAnimationProps {
  className?: string;
  barClassName?: string;
}

const SpeakingAnimation = ({
  className,
  barClassName,
}: SpeakingAnimationProps) => {
  return (
    <div id="bars" className={className}>
      <div className={cn("bar", barClassName)}></div>
      <div className={cn("bar", barClassName)}></div>
      <div className={cn("bar", barClassName)}></div>
      <div className={cn("bar", barClassName)}></div>
      <div className={cn("bar", barClassName)}></div>
    </div>
  );
};

export default SpeakingAnimation;
