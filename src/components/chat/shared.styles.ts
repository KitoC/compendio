import clsx from "clsx";

export const getContainerStyles = ({ isUser }) => {
  return clsx("flex flex-col gap-1 mb-4 w-fit max-w-[85%]", {
    "flex-row-reverse ml-auto": isUser,
    "flex-row": !isUser,
  });
};

export const messageBubbleStyles =
  "px-3 py-[3px] flex-grow w-full rounded-lg border";
export const userMessageStyles = "bg-primary text-primary-foreground";
export const otherMessageStyles =
  "bg-background dark:transparent dark:text-white dark:border-slate-700 transition-all duration-300";

export const getMessageBubbleStyles = ({ isUser, functionalMessages = [] }) => {
  return clsx(messageBubbleStyles, {
    [userMessageStyles]: isUser,
    [otherMessageStyles]: !isUser,
    "rounded-b-none": functionalMessages.length > 0,
  });
};
