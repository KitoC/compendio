const FromAndToLabel = ({
  fromEmail,
  fromName,
}: {
  fromEmail: string;
  fromName: string;
}) => {
  return (
    <div className="w-full text-left">
      <p className="text-sm text-muted-foreground truncate w-full">
        <span className="font-bold">{fromName || fromEmail}</span>{" "}
      </p>

      {fromName && (
        <p className="text-sm text-muted-foreground truncate w-full">
          {fromEmail}
        </p>
      )}
    </div>
  );
};

export default FromAndToLabel;
