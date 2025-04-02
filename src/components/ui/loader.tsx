const ThreeDotLoader = () => {
  return (
    <div className="flex items-center space-x-2 border-[3px] border-primary rounded-md p-2">
      <div
        className="w-2 h-2 bg-primary rounded-full animate-bounce"
        style={{ animationDelay: "0ms" }}
      ></div>
      <div
        className="w-2 h-2 bg-primary rounded-full animate-bounce"
        style={{ animationDelay: "150ms" }}
      ></div>
      <div
        className="w-2 h-2 bg-primary rounded-full animate-bounce"
        style={{ animationDelay: "300ms" }}
      ></div>
    </div>
  );
};
const Loader = () => {
  return <ThreeDotLoader />;
};

export default Loader;
