import clsx from "clsx";

const SIZES = {
  xsmall: {
    DOT: "w-[6px] h-[6px]",
    CONTAINER: "p-[6px] border-[2px] rounded-[6px]  space-x-1 h-fit",
  },
  small: {
    DOT: "w-[8px] h-[8px]",
    CONTAINER: "p-[6px] border-[2px] rounded-[6px]  space-x-1 h-fit",
  },
  medium: {
    DOT: "w-[10px] h-[10px]",
    CONTAINER: "p-[8px] border-[3px] rounded-[6px]  space-x-1 h-fit",
  },
  large: {
    DOT: "w-[12px] h-[12px]",
    CONTAINER: "pt-[8px] border-[3px] rounded-[6px] space-x-1 h-fit ",
  },
};

const ThreeDotLoader = ({ size = "small", className }) => {
  const { DOT, CONTAINER } = SIZES?.[size] || SIZES.small;
  const dotSize = "w-2 h-2";
  return (
    <div
      className={clsx(
        "flex items-center border-[3px] border-primary rounded-md p-2 w-fit",
        CONTAINER,
        className
      )}
    >
      <div
        className={clsx(DOT, "bg-primary rounded-full animate-bounce")}
        style={{ animationDelay: "150ms" }}
      ></div>
      <div
        className={clsx(DOT, "bg-primary rounded-full animate-bounce")}
        style={{ animationDelay: "300ms" }}
      ></div>
      <div
        className={clsx(DOT, "bg-primary rounded-full animate-bounce")}
        style={{ animationDelay: "450ms" }}
      ></div>
    </div>
  );
};
const Loader = ({
  size = "small",
  className,
}: {
  size?: "xsmall" | "small" | "medium" | "large";
  className?: string;
}) => {
  return <ThreeDotLoader size={size} className={className} />;
};

export default Loader;
