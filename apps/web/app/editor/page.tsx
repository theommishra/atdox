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
import React from 'react';

type ToolbarButton = {
  id: string;
  action: () => void;
  icon: React.ReactNode;
  label: string;
  isActive?: () => boolean;
  disabled?: () => boolean;
  className?: string;
};

export default function TiptapEditor() {
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [fileId, setFileId] = useState<number | null>(null);

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

  const handleSave = async () => {
    if (!editor) return;
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const content = editor.getHTML();
      const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
      
      if (!token) {
        setSaveMessage('Please sign in to save files');
        return;
      }

      const response = await fetch('http://localhost:3002/createProject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          tittle: 'New Document',
          data: content
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      const data = await response.json();
      if (data.fileId) {
        setFileId(data.fileId);
      }
      setSaveMessage('New file created successfully!');
    } catch (error) {
      setSaveMessage('Failed to create new file. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editor || !fileId) {
      setSaveMessage('Please save the file first before updating.');
      return;
    }
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const content = editor.getHTML();
      const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
      
      if (!token) {
        setSaveMessage('Please sign in to update files');
        return;
      }

      const response = await fetch('http://localhost:3002/saveproject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          id: fileId,
          data: content
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      setSaveMessage('File updated successfully!');
    } catch (error) {
      setSaveMessage('Failed to update file. Please try again.');
      console.error('Update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !editor) return null;

  const toolbarButtons: ToolbarButton[] = [
    {
      id: 'bold',
      action: () => editor.chain().focus().toggleBold().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
        </svg>
      ),
      label: 'Toggle Bold',
      isActive: () => editor.isActive('bold'),
      disabled: () => !editor.can().chain().focus().toggleBold().run()
    },
    {
      id: 'italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="4" x2="10" y2="4"></line>
          <line x1="14" y1="20" x2="5" y2="20"></line>
          <line x1="15" y1="4" x2="9" y2="20"></line>
        </svg>
      ),
      label: 'Toggle Italic',
      isActive: () => editor.isActive('italic'),
      disabled: () => !editor.can().chain().focus().toggleItalic().run()
    },
    {
      id: 'highlight',
      action: () => editor.chain().focus().toggleHighlight().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l-6 6v3h9l3-3"></path>
          <path d="M22 12l-4.586 4.586a2 2 0 0 1-2.828 0L9 13l3-3 4.586 4.586a2 2 0 0 1 0 2.828L22 12z"></path>
        </svg>
      ),
      label: 'Toggle Highlight',
      isActive: () => editor.isActive('highlight'),
      disabled: () => !editor.can().chain().focus().toggleHighlight().run()
    },
    {
      id: 'code',
      action: () => editor.chain().focus().toggleCode().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      ),
      label: 'Toggle Code',
      isActive: () => editor.isActive('code'),
    },
    {
      id: 'strike',
      action: () => editor.chain().focus().toggleStrike().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <path d="M16 6C13.7909 6 12 7.79086 12 10C12 12.2091 13.7909 14 16 14H18C20.2091 14 22 15.7909 22 18C22 20.2091 20.2091 22 18 22H8"></path>
        </svg>
      ),
      label: 'Toggle Strike',
      isActive: () => editor.isActive('strike'),
      disabled: () => !editor.can().chain().focus().toggleStrike().run()
    },
    {
      id: 'bullet',
      action: () => editor.chain().focus().toggleBulletList().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <circle cx="3" cy="6" r="2"></circle>
          <circle cx="3" cy="12" r="2"></circle>
          <circle cx="3" cy="18" r="2"></circle>
        </svg>
      ),
      label: 'Toggle Bullet List',
      isActive: () => editor.isActive('bulletList'),
    },
    {
      id: 'ordered',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6"></line>
          <line x1="10" y1="12" x2="21" y2="12"></line>
          <line x1="10" y1="18" x2="21" y2="18"></line>
          <path d="M4 6h1v4"></path>
          <path d="M4 10h2"></path>
          <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
        </svg>
      ),
      label: 'Toggle Ordered List',
      isActive: () => editor.isActive('orderedList'),
    },
    {
      id: 'align-left',
      action: () => editor.chain().focus().setTextAlign('left').run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="15" y2="12"></line>
          <line x1="3" y1="18" x2="18" y2="18"></line>
        </svg>
      ),
      label: 'Align Left',
      isActive: () => editor.isActive({ textAlign: 'left' }),
    },
    {
      id: 'align-center',
      action: () => editor.chain().focus().setTextAlign('center').run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="6" y1="12" x2="18" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      ),
      label: 'Align Center',
      isActive: () => editor.isActive({ textAlign: 'center' }),
    },
    {
      id: 'align-right',
      action: () => editor.chain().focus().setTextAlign('right').run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="9" y1="12" x2="21" y2="12"></line>
          <line x1="6" y1="18" x2="21" y2="18"></line>
        </svg>
      ),
      label: 'Align Right',
      isActive: () => editor.isActive({ textAlign: 'right' }),
    },
    {
      id: 'justify',
      action: () => editor.chain().focus().setTextAlign('justify').run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      ),
      label: 'Justify',
      isActive: () => editor.isActive({ textAlign: 'justify' }),
    },
    {
      id: 'h1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      icon: 'H1',
      label: 'Heading 1',
      isActive: () => editor.isActive('heading', { level: 1 }),
      className: 'text-xs px-3'
    },
    {
      id: 'h2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      icon: 'H2',
      label: 'Heading 2',
      isActive: () => editor.isActive('heading', { level: 2 }),
      className: 'text-xs px-3'
    },
    {
      id: 'h3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      icon: 'H3',
      label: 'Heading 3',
      isActive: () => editor.isActive('heading', { level: 3 }),
      className: 'text-xs px-3'
    },
    {
      id: 'h4',
      action: () => editor.chain().focus().toggleHeading({ level: 4 }).run(),
      icon: 'H4',
      label: 'Heading 4',
      isActive: () => editor.isActive('heading', { level: 4 }),
      className: 'text-xs px-3'
    },
    {
      id: 'h5',
      action: () => editor.chain().focus().toggleHeading({ level: 5 }).run(),
      icon: 'H5',
      label: 'Heading 5',
      isActive: () => editor.isActive('heading', { level: 5 }),
      className: 'text-xs px-3'
    },
    {
      id: 'h6',
      action: () => editor.chain().focus().toggleHeading({ level: 6 }).run(),
      icon: 'H6',
      label: 'Heading 6',
      isActive: () => editor.isActive('heading', { level: 6 }),
      className: 'text-xs px-3'
    },
    {
      id: 'Undo',
      action: () => editor.chain().focus().undo().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6"></path>
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
        </svg>
      ),
      label: 'Undo',
      isActive: () => false,
      disabled: () => !editor.can().chain().focus().undo().run()
    },
    {
      id: 'Redo',
      action: () => editor.chain().focus().redo().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6"></path>
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
        </svg>
      ),
      label: 'Redo',
      isActive: () => false,
      disabled: () => !editor.can().chain().focus().redo().run(),
    },
    {
      id: 'Horizontal Rule',
      action: () => editor.chain().focus().setHorizontalRule().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ),
      label: 'Horizontal Rule',
      isActive: () => false,
      disabled: () => false,
    },
    {
      id: 'Clear Marks',
      action: () => editor.chain().focus().unsetAllMarks().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18"></path>
          <path d="M6 6l12 12"></path>
        </svg>
      ),
      label: 'Clear Marks',
      isActive: () => false,
      disabled: () => false,
    },
    {
      id: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
        </svg>
      ),
      label: 'Blockquote',
      isActive: () => editor.isActive('blockquote'),
      disabled: () => false,
    },
  ];


  return (
    <div className="mx-auto my-6 max-w-7xl border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900">
      {/* Fixed Save/Update Buttons */}
      <div className="sticky top-0 z-[1] bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 p-2 flex justify-end gap-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          variant="primary"
          size="sm"
          type="button"
          aria-label="Save as New File"
          title="Save as New File"
          className="dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
        </Button>
        <Button
          onClick={handleUpdate}
          disabled={isSaving || !fileId}
          variant="primary"
          size="sm"
          type="button"
          aria-label="Update Existing File"
          title="Update Existing File"
          className="dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 p-4" role="toolbar" aria-label="Text formatting">
          {/* Text Formatting */}
          <div className="flex flex-col items-center border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-900">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Format</div>
            <div className="flex gap-2">
              {toolbarButtons.slice(0, 5).map(({ id, action, icon, label, isActive, disabled }) => {
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
                    title={label}
                    className={`${active ? 'is-active dark:bg-gray-700 dark:text-white dark:border-gray-600' : 'dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-300'}`}
                  >
                    {icon}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Lists */}
          <div className="flex flex-col items-center border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-900">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Lists</div>
            <div className="flex gap-2">
              {toolbarButtons.slice(5, 7).map(({ id, action, icon, label, isActive, disabled }) => {
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
                    title={label}
                    className={`${active ? 'is-active dark:bg-gray-700 dark:text-white dark:border-gray-600' : 'dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-300'}`}
                  >
                    {icon}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Alignment */}
          <div className="flex flex-col items-center border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-900">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Alignment</div>
            <div className="flex gap-2">
              {toolbarButtons.slice(7, 11).map(({ id, action, icon, label, isActive, disabled }) => {
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
                    title={label}
                    className={`${active ? 'is-active dark:bg-gray-700 dark:text-white dark:border-gray-600' : 'dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-300'}`}
                  >
                    {icon}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Headings */}
          <div className="flex flex-col items-center border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-900">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Headings</div>
            <div className="flex gap-2">
              {toolbarButtons.slice(11, 17).map(({ id, action, icon, label, isActive, disabled, className }) => {
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
                    title={label}
                    className={`${active ? 'is-active dark:bg-gray-700 dark:text-white dark:border-gray-600' : 'dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-300'} ${className || ''}`}
                  >
                    {icon}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-900">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Actions</div>
            <div className="flex gap-2">
              {toolbarButtons.slice(17).map(({ id, action, icon, label, isActive, disabled }) => {
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
                    title={label}
                    className={`${active ? 'is-active dark:bg-gray-700 dark:text-white dark:border-gray-600' : 'dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-300'}`}
                  >
                    {icon}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {saveMessage && (
        <div className={`px-4 py-2 text-sm ${saveMessage.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {saveMessage}
        </div>
      )}

      {/* Editor Content */}
      <EditorContent
        className="tiptap p-4 min-h-[200px] focus:outline-none dark:bg-gray-900 dark:text-gray-100"
        editor={editor}
      />
    </div>
  );
}
