const Page = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="container mx-auto py-8 max-w-8xl flex flex-col h-full">
      {children}
    </div>
  );
};

export default Page;
