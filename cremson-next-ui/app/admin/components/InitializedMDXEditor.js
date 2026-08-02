"use client";

import React from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

export default function InitializedMDXEditor({ editorRef, markdown, onChange, placeholder }) {
  return (
    <MDXEditor
      ref={editorRef}
      markdown={markdown || ""}
      onChange={onChange}
      placeholder={placeholder}
      className="mdxeditor-custom w-full border border-gray-300 rounded-lg overflow-hidden bg-white text-left"
      contentEditableClassName="prose max-w-none text-sm text-gray-700 outline-none p-4 min-h-[250px]"
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2 w-full">
              <UndoRedo />
              <span className="h-5 w-[1px] bg-gray-300 mx-1" />
              <BoldItalicUnderlineToggles />
              <span className="h-5 w-[1px] bg-gray-300 mx-1" />
              <BlockTypeSelect />
              <span className="h-5 w-[1px] bg-gray-300 mx-1" />
              <ListsToggle />
            </div>
          ),
        }),
      ]}
    />
  );
}
