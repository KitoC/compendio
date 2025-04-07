import { EditorProvider, FloatingMenu, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// define your extension array
const extensions = [StarterKit];

function convertLineBreaksToHtml(text: string): string {
  return text.replace(/\n/g, "<br>");
}

export default function EmailEditor({ value, ...props }) {
  return (
    <EditorProvider
      extensions={extensions}
      content={convertLineBreaksToHtml(value)}
      {...props}
    >
      {/* <FloatingMenu editor={null}>This is the floating menu</FloatingMenu>
      <BubbleMenu editor={null}>This is the bubble menu</BubbleMenu> */}
    </EditorProvider>
  );
}
