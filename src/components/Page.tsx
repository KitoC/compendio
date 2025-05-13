const Page = ({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto w-full">
      <div className="flex flex-col h-full gap-4 w-full px-8 py-8">
        <div className="flex w-full">
          <div className="flex flex-col gap-2">
            {title && typeof title === "string" && (
              <h1 className="text-2xl font-bold">{title}</h1>
            )}

            {title && typeof title !== "string" && title}
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        <div className="flex-1 pb-8 w-full">{children}</div>
      </div>
    </div>
  );
};

export default Page;
