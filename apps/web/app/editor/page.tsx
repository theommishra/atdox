'use client';

import './style.scss';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Code from '@tiptap/extension-code';
import Strike from '@tiptap/extension-strike';
import BulletList from '@tiptap/extension-bullet-list';
import Button from "../../../../packages/ui/src/button";
import { useEffect, useState } from 'react';

type ToolbarButton = {
  id: string;
  action: () => void;
  icon: string;
  label: string;
};

export default function TiptapEditor() {
  const [mounted, setMounted] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      Highlight.configure({ multicolor: true }),
      Code,
      Strike,
      BulletList.configure({
        itemTypeName: 'listItem',
        keepMarks: true,
      }),
    ],
    content: '<p>Hello World!!!!</p>',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !editor) return null;

  const toolbarButtons: ToolbarButton[] = [
    { id: 'bold', action: () => editor.chain().focus().toggleBold().run(), icon: 'Bold', label: 'Toggle Bold' },
    { id: 'italic', action: () => editor.chain().focus().toggleItalic().run(), icon: 'Italic', label: 'Toggle Italic' },
    { id: 'highlight', action: () => editor.chain().focus().toggleHighlight().run(), icon: 'Highlight', label: 'Toggle Highlight' },
    { id: 'code', action: () => editor.chain().focus().toggleCode().run(), icon: 'Code', label: 'Toggle Code' },
    { id: 'strike', action: () => editor.chain().focus().toggleStrike().run(), icon: 'Strike', label: 'Toggle Strike' },
    { id: 'bullet', action: () => editor.chain().focus().toggleBulletList().run(), icon: 'Bullet Items', label: 'Toggle Bullet List' },
    { id: 'align-left', action: () => editor.chain().focus().setTextAlign('left').run(), icon: 'Align Left', label: 'Align Left' },
    { id: 'align-center', action: () => editor.chain().focus().setTextAlign('center').run(), icon: 'Align Center', label: 'Align Center' },
    { id: 'align-right', action: () => editor.chain().focus().setTextAlign('right').run(), icon: 'Align Right', label: 'Align Right' },
  ];

  return (
    <div className="mx-auto my-6 max-w-4xl border border-gray-300 rounded-lg shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-4 border-b bg-gray-50" role="toolbar" aria-label="Text formatting">
        {toolbarButtons.map(({ id, action, icon, label }) => (
          <Button
            key={id}
            onClick={action}
            variant="primary"
            size="sm"
            type="button"
            aria-label={label}
          >
            {icon}
          </Button>
        ))}
      </div>

      {/* Editor Content */}
      <EditorContent
        className="tiptap p-4 min-h-[200px] focus:outline-none"
        editor={editor}
      />
    </div>
  );
}
