import React, { useMemo, useRef } from "react";
import JoditEditor from "jodit-react";

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  className = "",
  height,
}) => {
  const editor = useRef(null);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: "",
      showPlaceholder: false,
      toolbarAdaptive: false,

      enter: "P",          // ✅ Important
      enterBlock: "li",    // ✅ Forces new <li> on Enter inside lists

      buttons: [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "ul",
        "ol",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "image",
        "table",
        "link",
        "|",
        "align",
        "undo",
        "redo",
        "|",
        "hr",
        "eraser",
      ],
      height: height || 300,
    }),
    [placeholder, height]
  );

  return (
    <div className={`rich-text-editor ${className}`}>
      <style>
        {`
          .rich-text-editor .jodit-wysiwyg ul {
            list-style-type: disc !important;
            padding-left: 40px !important;
            margin-top: 8px !important;
            margin-bottom: 8px !important;
          }
          .rich-text-editor .jodit-wysiwyg ol {
            list-style-type: decimal !important;
            padding-left: 40px !important;
            margin-top: 8px !important;
            margin-bottom: 8px !important;
          }
          .rich-text-editor .jodit-wysiwyg li {
            display: list-item !important;
          }
        `}
      </style>
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={(newContent) => onChange(newContent)}
        onChange={() => {}}
      />
    </div>
  );
};

export default RichTextEditor;