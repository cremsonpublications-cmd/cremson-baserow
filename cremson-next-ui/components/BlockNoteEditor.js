"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@mantine/core/styles.css";
import "@blocknote/mantine/style.css";
import { useEffect, useRef } from "react";

export default function BlockNoteEditor({ initialHTML, onChangeHTML }) {
  const editor = useCreateBlockNote();
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (editor && initialHTML && !isLoadedRef.current) {
      async function loadHTML() {
        try {
          const blocks = await editor.tryParseHTMLToBlocks(initialHTML);
          if (blocks && blocks.length > 0) {
            editor.replaceBlocks(editor.document, blocks);
          }
        } catch (err) {
          console.error("BlockNote HTML parse error:", err);
        }
        isLoadedRef.current = true;
      }
      loadHTML();
    }
  }, [editor, initialHTML]);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden min-h-[350px] bg-white text-gray-900 shadow-inner p-2">
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={async () => {
          try {
            const html = await editor.blocksToHTMLExporter(editor.document);
            onChangeHTML(html);
          } catch (err) {
            console.error("BlockNote HTML export error:", err);
          }
        }}
      />
    </div>
  );
}
