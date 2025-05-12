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
    <div className="container mx-auto py-8 max-w-8xl flex flex-col h-full">
      <div className="flex flex-col h-full overflow-y-auto gap-4 w-full">
        <div className="flex w-full">
          <div className="flex flex-col gap-2">
            {title && typeof title === "string" && (
              <h1 className="text-2xl font-bold">{title}</h1>
            )}

            {title && typeof title !== "string" && title}
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default Page;
