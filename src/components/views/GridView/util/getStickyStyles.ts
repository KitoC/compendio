import type { GridViewColumn } from "../GridView";

const sharedStyles = "sticky  !z-30 opacity-95";

const borderStyle =
  "after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:border-border z-10";

const shadowStyle =
  "before:content-[''] before:absolute before:bottom-0 before:left-[-2px] before:right-[-2px] before:top-0 after:pointer-events-none z-10";

const getStickyStyles = <RecordType>(
  colId: string,
  columns: GridViewColumn<RecordType>[],
  isHeader: boolean
) => {
  const isFirst = colId?.toString() === columns[0]?.id?.toString();
  const isActions = colId === "actions";
  let styles = "";

  if (isHeader) {
    styles = `${borderStyle} after:border-b-2 ${shadowStyle}`;
  }

  if (!isFirst && !isActions) {
    return (styles += " border-r");
  }

  styles += ` ${sharedStyles} ${borderStyle}`;
  //   if (isHeader) {

  if (isFirst) {
    styles += ` left-0 after:border-r max-w-[150px] truncate bg-background`;
  }

  if (isActions) {
    styles += ` right-0 after:border-l !max-w-[150px] truncate bg-background`;
  }

  return styles;
};

export default getStickyStyles;
