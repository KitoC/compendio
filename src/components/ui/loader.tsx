import clsx from "clsx";

const ThreeDotLoader = ({ size = "small" }) => {
  const dotSize = "w-2 h-2";
  return (
    <div
      className={clsx(
        "flex items-center space-x-2 border-[3px] border-primary rounded-md p-2 w-fit",
        {
          "scale-65": size === "small",
          "scale-85": size === "medium",
          "scale-115": size === "large",
        }
      )}
    >
      <div
        className={clsx(dotSize, "bg-primary rounded-full animate-bounce")}
        style={{ animationDelay: "150ms" }}
      ></div>
      <div
        className={clsx(dotSize, "bg-primary rounded-full animate-bounce")}
        style={{ animationDelay: "300ms" }}
      ></div>
      <div
        className={clsx(dotSize, "bg-primary rounded-full animate-bounce")}
        style={{ animationDelay: "300ms" }}
      ></div>
    </div>
  );
};
const Loader = ({ size = "small" }) => {
  return <ThreeDotLoader size={size} />;
};

export default Loader;
