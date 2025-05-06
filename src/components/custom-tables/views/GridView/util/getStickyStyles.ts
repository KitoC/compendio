import { CustomTableField } from "@/types/customTable";

const sharedStyles = "sticky  bg-background  !z-30 opacity-95";

const borderStyle =
  "after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:border-border z-10";

const shadowStyle =
  "before:content-[''] before:absolute before:bottom-0 before:left-[-2px] before:right-[-2px] before:top-0 after:pointer-events-none z-10";
const getStickyStyles = (
  colId: string,
  displayFields: CustomTableField[],
  isHeader: boolean
) => {
  const isFirst = colId?.toString() === displayFields[0]?.id?.toString();
  const isActions = colId === "actions";
  let styles = "";

  if (isHeader) {
    styles = `${borderStyle} after:border-b-2 ${shadowStyle}`;
  }

  if (!isFirst && !isActions) {
    return styles;
  }

  styles += ` ${sharedStyles} ${borderStyle}`;
  //   if (isHeader) {

  if (isFirst) {
    styles += ` left-0 after:border-r max-w-[150px] truncate`;
  }

  if (isActions) {
    styles += ` right-0 after:border-l`;
  }

  return styles;
};

export default getStickyStyles;
