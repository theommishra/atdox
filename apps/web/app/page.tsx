'use client';
import './style.scss'

import { useEditor, EditorContent } from '@tiptap/react';
import { IconButton } from './components/IconButton';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Code from '@tiptap/extension-code';
import Strike from '@tiptap/extension-strike';
import BulletList from '@tiptap/extension-bullet-list';

export default function TiptapEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Code,
      Strike,
      BulletList.configure({
        itemTypeName: 'listItem',
        keepMarks: true,
      })
      
    ],
    content: '<p>Hello World!!!! </p>',
  });

  if (!editor) return null;

  return (
    <div >
      <IconButton onClick={() => editor.chain().focus().toggleBold().run()} icon="Bold"></IconButton>
      <IconButton onClick={() => editor.chain().focus().toggleItalic().run()} icon="Italic"></IconButton>
      <IconButton onClick={() => editor.chain().focus().toggleHighlight().run()} icon="Highlight"></IconButton>
      <IconButton onClick={() => editor.chain().focus().setTextAlign("right").run()} icon="Right"></IconButton>
      <IconButton onClick={() => editor.chain().focus().setTextAlign("left").run()} icon="Left"></IconButton>
      <IconButton onClick={() => editor.chain().focus().setTextAlign("center").run()} icon="Center"></IconButton>
      <IconButton onClick={() => editor.chain().focus().toggleCode().run()} icon="Code"></IconButton>
      <IconButton onClick={() => editor.chain().focus().toggleStrike().run()} icon="Strike"></IconButton>
      <IconButton onClick={() => editor.chain().focus().toggleBulletList().run()} icon="Bullet Items"></IconButton>
      <EditorContent className='tiptap border-2 rounded-lg mx-24 my-2 p-1' editor={editor} />
    </div>
  );
}
