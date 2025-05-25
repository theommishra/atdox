'use client';

import './style.scss';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Code from '@tiptap/extension-code';
import Strike from '@tiptap/extension-strike';
import Button from "../../../../packages/ui/src/button";
import { useEffect, useState } from 'react';

type ToolbarButton = {
  id: string;
  action: () => void;
  icon: string;
  label: string;
  isActive?: () => boolean;
  disabled?: () => boolean;

};

export default function TiptapEditor() {
  const [mounted, setMounted] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right','justify'],
      }),
      Highlight.configure({ multicolor: true }),
      Code,
      Strike,
    ],
    content: '<p>Hello World!!!!</p>',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !editor) return null;

  const toolbarButtons: ToolbarButton[] = [
    {
      id: 'bold',
      action: () => editor.chain().focus().toggleBold().run(),
      icon: 'Bold',
      label: 'Toggle Bold',
      isActive: () => editor.isActive('bold'),
      disabled: () => !editor.can().chain().focus().toggleBold().run()
    },
    {
      id: 'italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      icon: 'Italic',
      label: 'Toggle Italic',
      isActive: () => editor.isActive('italic'),
      disabled: () => !editor.can().chain().focus().toggleItalic().run()
    },
    {
      id: 'highlight',
      action: () => editor.chain().focus().toggleHighlight().run(),
      icon: 'Highlight',
      label: 'Toggle Highlight',
      isActive: () => editor.isActive('highlight'),
      disabled: () => !editor.can().chain().focus().toggleHighlight().run()
    },
    {
      id: 'code',
      action: () => editor.chain().focus().toggleCode().run(),
      icon: 'Code',
      label: 'Toggle Code',
      isActive: () => editor.isActive('code'),
    },
    {
      id: 'strike',
      action: () => editor.chain().focus().toggleStrike().run(),
      icon: 'Strike',
      label: 'Toggle Strike',
      isActive: () => editor.isActive('strike'),
      disabled: () => !editor.can().chain().focus().toggleStrike().run()
    },
    {
      id: 'bullet',
      action: () => editor.chain().focus().toggleBulletList().run(),
      icon: 'Bullet Items',
      label: 'Toggle Bullet List',
      isActive: () => editor.isActive('bulletList'),
    },
    {
      id: 'ordered',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      icon: 'Ordered Items',
      label: 'Toggle Bullet List',
      isActive: () => editor.isActive('orderedList'),
    },
    {
      id: 'align-left',
      action: () => editor.chain().focus().setTextAlign('left').run(),
      icon: 'Align Left',
      label: 'Align Left',
      isActive: () => editor.isActive({ textAlign: 'left' }),
    },
    {
      id: 'align-center',
      action: () => editor.chain().focus().setTextAlign('center').run(),
      icon: 'Align Center',
      label: 'Align Center',
      isActive: () => editor.isActive({ textAlign: 'center' }),
    },
    {
      id: 'align-right',
      action: () => editor.chain().focus().setTextAlign('right').run(),
      icon: 'Align Right',
      label: 'Align Right',
      isActive: () => editor.isActive({ textAlign: 'right' }),
    },
    {
      id: 'justify',
      action: () => editor.chain().focus().setTextAlign('justify').run(),
      icon: 'Justify',
      label: 'Justify',
      isActive: () => editor.isActive({ textAlign: 'justify' }),
    },
    {
      id: 'h1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      icon: 'H1',
      label: 'h1',
      isActive: () => editor.isActive('heading', { level: 1 }),
    }, {
      id: 'h2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      icon: 'H2',
      label: 'h2',
      isActive: () => editor.isActive('heading', { level: 2 }),
    }, {
      id: 'h3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      icon: 'H3',
      label: 'h3',
      isActive: () => editor.isActive('heading', { level: 3 }),
    }, {
      id: 'h4',
      action: () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
      icon: 'H4',
      label: 'h4',
      isActive: () => editor.isActive('heading', { level: 4 }),
    }, {
      id: 'h5',
      action: () => editor.chain().focus().toggleHeading({ level: 5 }).run(),
      icon: 'H5',
      label: 'h5',
      isActive: () => editor.isActive('heading', { level: 5 }),
    },
    {
      id: 'h6',
      action: () => editor.chain().focus().toggleHeading({ level: 6 }).run(),
      icon: 'H6',
      label: 'h6',
      isActive: () => editor.isActive('heading', { level: 6 }),
    },
    {
      id: 'Undo',
      action: () => editor.chain().focus().undo().run(),
      icon: 'Undo',
      label: 'Undo',
      isActive: () => false,
      disabled: () => !editor.can().chain().focus().undo().run()
    },
    {
      id: 'Redo',
      action: () => editor.chain().focus().redo().run(),
      icon: 'Redo',
      label: 'Redo',
      isActive: () => false,
      disabled: () => !editor.can().chain().focus().redo().run(),
    },
    {
      id: 'Horizontal Rule',
      action: () => editor.chain().focus().setHorizontalRule().run(),
      icon: 'Horizontal Rule',
      label: 'Horizontal Rule',
      isActive: () => false,
      disabled: () => false,
    },
    {
      id: 'Clear Marks',
      action: () => editor.chain().focus().unsetAllMarks().run(),
      icon: 'Clear Marks',
      label: 'Clear Marks',
      isActive: () => false,
      disabled: () => false,
    },
    {
      id: 'Blockquote',
      action:  () => editor.chain().focus().toggleBlockquote().run(),
      icon: 'Black Quote',
      label: 'Black Quote',
      isActive: () => editor.isActive('blockquote'),
      disabled: () => false,
    },



  ];


  return (
    <div className="mx-auto my-6 max-w-4xl border border-gray-300 rounded-lg shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-4 border-b bg-gray-50" role="toolbar" aria-label="Text formatting">
        {toolbarButtons.map(({ id, action, icon, label, isActive, disabled }) => {
          const active = isActive?.();
          const isDisabled = disabled?.();
          return (
            <Button
              key={id}
              onClick={action}
              disabled={isDisabled}
              variant={active ? 'secondary' : 'primary'}
              size="sm"
              type="button"
              aria-label={label}
              className={active ? 'is-active' : ''}
            >
              {icon}
            </Button>
          );
        })}

      </div>

      {/* Editor Content */}
      <EditorContent
        className="tiptap p-4 min-h-[200px] focus:outline-none"
        editor={editor}
      />
    </div>
  );
}
