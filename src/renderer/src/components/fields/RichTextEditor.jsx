import { useMemo, useRef } from 'react'
import JoditEditor from 'jodit-react'

const RichTextEditor = ({ value, onChange, placeholder, className = '' }) => {
  const editor = useRef(null)

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: placeholder || 'Start typing...',
      toolbarAdaptive: false,
      buttons: [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        '|',
        'ul',
        'ol',
        '|',
        'font',
        'fontsize',
        'brush',
        'paragraph',
        '|',
        'image',
        'table',
        'link',
        '|',
        'align',
        'undo',
        'redo',
        '|',
        'hr',
        'eraser',
        'fullsize'
      ],
      height: 300,
      style: {
        color: '#000000',
        backgroundColor: '#ffffff'
      }
    }),
    [placeholder]
  )

  return (
    <div className={`rich-text-editor ${className}`}>
      <JoditEditor
        ref={editor}
        value={value}
        config={config}
        onBlur={(newContent) => onChange(newContent)}
        onChange={() => {}}
      />
    </div>
  )
}

export default RichTextEditor
