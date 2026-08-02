"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import the initialized editor component, disabling server-side rendering
const MDXEditorComponent = dynamic(() => import("./InitializedMDXEditor"), {
  ssr: false,
});

export default function BlogEditor({ editorRef, markdown, onChange, placeholder }) {
  return (
    <MDXEditorComponent
      editorRef={editorRef}
      markdown={markdown}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
}
