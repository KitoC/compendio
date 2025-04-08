import clsx from "clsx";
import { useState } from "react";
import RenderMarkdown from "../../RenderMarkdown";

import EmailEditor from "./EmailEditor";
import { useDebouncedCallback } from "use-debounce";

export const Markdown = ({
  editable,
  mdValue,
  onEdit,
}: {
  editable: boolean;
  mdValue: string;
  onEdit: (newValue: string) => void;
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
  isMarkdown,
}: {
  label: string | JSX.Element;
  value: string | JSX.Element;
  labelClassName?: string;
  valueClassName?: string;
  isMarkdown?: boolean;
}) => {
  if (!value) return null;

  return (
    <div className={clsx("flex gap-1 flex-col")}>
      <p
        className={clsx(
          "text-sm text-muted-foreground font-bold align-start",
          labelClassName
        )}
      >
        {label}{" "}
      </p>
      {isMarkdown ? (
        <RenderMarkdown
          className="flex-1"
          message={value as string}
          isUser={false}
        />
      ) : (
        <p className={clsx("flex flex-1 items-center", valueClassName)}>
          {value}
        </p>
      )}
    </div>
  );
};
