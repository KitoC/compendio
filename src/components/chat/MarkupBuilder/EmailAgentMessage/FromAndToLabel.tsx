const FromAndToLabel = ({
  fromEmail,
  fromName,
}: {
  fromEmail: string;
  fromName: string;
}) => {
  return (
    <div className="w-full text-left">
      <p className="text-xs text-muted-foreground truncate w-full">
        From: <span className="font-bold">{fromName || fromEmail}</span>{" "}
        {fromName && (
          <span className="text-muted-foreground text-[10px]">
            ({fromEmail})
          </span>
        )}
      </p>
    </div>
  );
};

export default FromAndToLabel;
