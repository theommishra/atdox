'use client';

import './style.scss';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Code from '@tiptap/extension-code';
import Strike from '@tiptap/extension-strike';
import BulletList from '@tiptap/extension-bullet-list';

import { IconButton } from '../../components/IconButton';

export default function TiptapEditor() {
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

  if (!editor) return null;

  const toolbarButtons = [
    { action: () => editor.chain().focus().toggleBold().run(), icon: 'Bold' },
    { action: () => editor.chain().focus().toggleItalic().run(), icon: 'Italic' },
    { action: () => editor.chain().focus().toggleHighlight().run(), icon: 'Highlight' },
    { action: () => editor.chain().focus().toggleCode().run(), icon: 'Code' },
    { action: () => editor.chain().focus().toggleStrike().run(), icon: 'Strike' },
    { action: () => editor.chain().focus().toggleBulletList().run(), icon: 'Bullet Items' },
    { action: () => editor.chain().focus().setTextAlign('left').run(), icon: 'Align Left' },
    { action: () => editor.chain().focus().setTextAlign('center').run(), icon: 'Align Center' },
    { action: () => editor.chain().focus().setTextAlign('right').run(), icon: 'Align Right' },
  ];

  return (
    <div className="mx-auto my-6 max-w-4xl border border-gray-300 rounded-lg shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-4 border-b bg-gray-50">
        {toolbarButtons.map(({ action, icon }) => (
          <IconButton key={icon} onClick={action} icon={icon} />
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
