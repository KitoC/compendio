import clsx from "clsx";
import { useState } from "react";
import RenderMarkdown from "../../RenderMarkdown";

import EmailEditor from "./EmailEditor";
import { useDebouncedCallback } from "use-debounce";

const Markdown = ({
  editable,
  mdValue,
  onEdit,
}: {
  editable: boolean;
  mdValue: string;
  onEdit: (newValue: string) => void;
  setMdValue: (newValue: string) => void;
}) => {
  const debouncedOnUpdate = useDebouncedCallback(({ editor }) => {
    onEdit(editor.getHTML());
  }, 750);

  return editable ? (
    <EmailEditor value={mdValue} onUpdate={debouncedOnUpdate} />
  ) : (
    <RenderMarkdown className="flex-1" message={mdValue} isUser={false} />
  );
};

export const LabelAndValue = ({
  label,
  value,
  labelClassName,
  valueClassName,
  editable = false,
  onEdit,
  isMarkdown,
}: {
  label: string | JSX.Element;
  value: string | JSX.Element;
  labelClassName?: string;
  valueClassName?: string;
  editable?: boolean;
  onEdit?: (value: string) => void;
  isMarkdown?: boolean;
}) => {
  const [mdValue, setMdValue] = useState(value);

  if (!value) return null;

  return (
    <div className="flex gap-1">
      <p
        className={clsx(
          "text-sm text-muted-foreground font-bold",
          labelClassName
          // { "pt-[0.75rem]": editable }
        )}
      >
        {label}{" "}
      </p>
      {isMarkdown ? (
        <Markdown
          editable={editable}
          mdValue={mdValue as string}
          onEdit={onEdit}
          setMdValue={setMdValue}
        />
      ) : (
        <p className={clsx("flex flex-1 items-center", valueClassName)}>
          {value}
        </p>
      )}
    </div>
  );
};
