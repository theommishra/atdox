'use client';

import './style.scss';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Code from '@tiptap/extension-code';
import Strike from '@tiptap/extension-strike';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Button from "../../../../packages/ui/src/button";
import { useEffect, useState, useCallback, useRef } from 'react';
import React from 'react';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import html2pdf from 'html2pdf.js';

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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [fileId, setFileId] = useState<number | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [selectionTimeout, setSelectionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Color.configure({ types: [TextStyle.name, Highlight.name] }),
      TextStyle,
      Highlight.configure({ multicolor: true }),
      Code,
      Strike,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: '<p>Loading...</p>',
    onUpdate: ({ editor }) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      setAutoSaveStatus('saving');
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 1000);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      
      // Clear any existing timeout
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }

      if (from !== to) {
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        
        // Position the toolbar above the selection
        const top = start.top - 50; // 50px above the selection
        const left = (start.left + end.left) / 2; // Center horizontally
        
        setToolbarPosition({ top, left });
        
        // Add a 150ms delay before showing the toolbar
        const timeout = setTimeout(() => {
          setShowToolbar(true);
        }, 150);
        
        setSelectionTimeout(timeout);
      } else {
        // Hide the toolbar immediately when selection is cleared
        setShowToolbar(false);
      }
    },
  });

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get fileId from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setFileId(parseInt(id));
    }
  }, []);

  // Load existing file data when we have a fileId
  useEffect(() => {
    const loadExistingFile = async () => {
      if (!editor || !fileId || !mounted) return;
      
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
        
        if (!token) {
          setSaveMessage('Please sign in to load files');
          return;
        }

        const response = await fetch(`http://localhost:3002/getProject/${fileId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load file');
        }

        const data = await response.json();
        if (data.data) {
          editor.commands.setContent(data.data);
          setAutoSaveStatus('saved');
        } else {
          console.error('No data in response:', data);
          throw new Error('No data received from server');
        }
      } catch (error) {
        console.error('File loading error:', error);
        setAutoSaveStatus('error');
        setSaveMessage('Failed to load file. Please try again.');
      }
    };

    loadExistingFile();
  }, [editor, fileId, mounted]);

  // Create initial file on mount
  useEffect(() => {
    const createInitialFile = async () => {
      // Only create a new file if we don't have a fileId from the URL
      if (!editor || fileId || !mounted) return;
      
      try {
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
            data: editor.getHTML()
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create initial file');
        }

        const data = await response.json();
        if (data.fileId) {
          setFileId(data.fileId);
          setAutoSaveStatus('saved');
        }
      } catch (error) {
        console.error('Initial file creation error:', error);
        setAutoSaveStatus('error');
      }
    };

    createInitialFile();
  }, [editor, fileId, mounted]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-heading-menu]')) {
        setShowHeadingMenu(false);
      }
      if (!target.closest('[data-color-menu]')) {
        setShowColorMenu(false);
      }
      if (!target.closest('[data-highlight-menu]')) {
        setShowHighlightMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
      }
    };
  }, [selectionTimeout]);

  const handleHeadingClick = (level: number) => {
    if (!editor) return;
    editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
    setShowHeadingMenu(false);
  };

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

  const colorOptions = [
    { name: 'Default', value: 'inherit' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
  ];

  const highlightOptions = [
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Blue', value: '#bae6fd' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Purple', value: '#e9d5ff' },
    { name: 'Orange', value: '#fed7aa' },
  ];

  const handleColorChange = (color: string) => {
    if (!editor) return;
    if (color === 'inherit') {
      editor.chain().focus().clearNodes().unsetAllMarks().run();
    } else {
      editor.chain().focus().setMark('textStyle', { color }).run();
    }
    setShowColorMenu(false);
  };

  const handleHighlightChange = (color: string) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { color: '#000000' }).setHighlight({ color }).run();
    setShowHighlightMenu(false);
  };

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!editor || !fileId) return;
    
    setAutoSaveStatus('saving');
    try {
      const content = editor.getHTML();
      const token = document.cookie.split('; ').find(row => row.startsWith('authorization='))?.split('=')[1];
      
      if (!token) {
        setAutoSaveStatus('error');
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
          data: content,
          tittle: 'Updated Document'
        }),
      });

      const data = await response.json();
      
      // Check if the response contains a success message
      if (data.message?.includes('successfully') || response.ok) {
        setAutoSaveStatus('saved');
      } else {
        console.error('Auto-save error response:', data);
        throw new Error(data.message || 'Failed to auto-save');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
    }
  }, [editor, fileId]);

  // Debounced auto-save
  const debouncedAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000); // 2 second delay
  }, [autoSave]);

  // Set up auto-save on content changes
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      if (fileId) {
        debouncedAutoSave();
      }
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editor, fileId, debouncedAutoSave]);

  const handleDownloadPDF = async () => {
    if (!editor) return;

    try {
      const content = editor.getHTML();
      const element = document.createElement('div');
      element.innerHTML = content;
      
      // Add styling for better PDF output
      const style = document.createElement('style');
      style.textContent = `
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #000000 !important;
          background-color: #ffffff !important;
        }
        h1 { font-size: 24px; margin-bottom: 16px; color: #000000 !important; }
        h2 { font-size: 20px; margin-bottom: 14px; color: #000000 !important; }
        h3 { font-size: 18px; margin-bottom: 12px; color: #000000 !important; }
        p { margin-bottom: 12px; color: #000000 !important; }
        ul, ol { margin-bottom: 12px; padding-left: 24px; color: #000000 !important; }
        li { margin-bottom: 6px; color: #000000 !important; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 4px; color: #000000 !important; }
        blockquote {
          border-left: 4px solid #ddd;
          margin: 16px 0;
          padding-left: 16px;
          color: #000000 !important;
        }
        * { color: #000000 !important; }
      `;
      element.prepend(style);
      
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
        filename: 'document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' as 'portrait' | 'landscape'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
      setSaveMessage('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      setSaveMessage('Failed to generate PDF. Please try again.');
    }
  };

  if (!editor) return null;

  const floatingToolbarButtons: ToolbarButton[] = [
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
    },
  ];

  const fixedToolbarButtons: ToolbarButton[] = [
    {
      id: 'undo',
      action: () => editor.chain().focus().undo().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7v6h6"></path>
          <path d="M3 13c0-4.97 4.03-9 9-9 4.97 0 9 4.03 9 9s-4.03 9-9 9c-2.12 0-4.08-.74-5.62-1.97"></path>
        </svg>
      ),
      label: 'Undo',
      disabled: () => !editor.can().undo(),
    },
    {
      id: 'redo',
      action: () => editor.chain().focus().redo().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 7v6h-6"></path>
          <path d="M21 13c0-4.97-4.03-9-9-9-4.97 0-9 4.03-9 9s4.03 9 9 9c2.12 0 4.08-.74 5.62-1.97"></path>
        </svg>
      ),
      label: 'Redo',
      disabled: () => !editor.can().redo(),
    },
    {
      id: 'clear',
      action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
      ),
      label: 'Clear Formatting',
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
      id: 'download',
      action: handleDownloadPDF,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      ),
      label: 'Download PDF',
      className: 'download-button'
    },
  ];

  return (
    <div className="mx-auto my-6 max-w-7xl border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900">
      {/* Auto-save Status Bar */}
      <div className="sticky top-0 z-[1] bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 p-2">
        <div className="flex items-center gap-2">
          {fileId && (
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              {autoSaveStatus === 'saving' && (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
                  <span>All changes saved</span>
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <svg className="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
                  <span>Error saving changes</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Formatting Toolbar */}
      <div className="sticky top-[41px] z-[1] bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 p-2">
        <div className="flex flex-wrap gap-2">
          {/* History and Clear Tools */}
          <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-700 pr-2">
            {fixedToolbarButtons.slice(0, 3).map(({ id, action, icon, label, isActive, disabled }) => {
                const active = isActive?.();
                const isDisabled = disabled?.();
                return (
                  <Button
                    key={id}
                    onClick={action}
                    variant={active ? 'secondary' : 'primary'}
                    size="sm"
                    type="button"
                    aria-label={label}
                    title={label}
                  disabled={isDisabled}
                  className={`${active ? 'is-active dark:bg-gray-700 dark:text-white dark:border-gray-600' : 'dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-300'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {icon}
                  </Button>
                );
              })}
          </div>

          {/* Alignment Tools */}
          <div className="flex items-center gap-2">
            {fixedToolbarButtons.slice(3).map(({ id, action, icon, label, isActive }) => {
                const active = isActive?.();
                return (
                  <Button
                    key={id}
                    onClick={action}
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

      {/* Floating Toolbar */}
      {showToolbar && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-2 transition-all duration-200 ease-in-out opacity-0 scale-95"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
            transform: 'translateX(-50%)',
            animation: 'toolbarFadeIn 0.2s ease-out forwards',
          }}
        >
          {floatingToolbarButtons.map(({ id, action, icon, label, isActive }) => {
                const active = isActive?.();
                return (
                  <Button
                    key={id}
                    onClick={action}
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

          {/* Heading Dropdown */}
          <div className="relative" data-heading-menu>
            <Button
              onClick={() => setShowHeadingMenu(!showHeadingMenu)}
              variant={editor.isActive('heading') ? 'secondary' : 'primary'}
              size="sm"
              type="button"
              aria-label="Headings"
              title="Headings"
              className={`${editor.isActive('heading') ? 'is-active dark:bg-gray-700 dark:text-white dark:border-gray-600' : 'dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-300'} flex items-center gap-1`}
            >
              H
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </Button>

            {showHeadingMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleHeadingClick(level)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      editor.isActive('heading', { level }) ? 'bg-gray-100 dark:bg-gray-700' : ''
                    }`}
                  >
                    {`Heading ${level}`}
                  </button>
                ))}
            </div>
            )}
          </div>

          {/* Color Dropdown */}
          <div className="relative" data-color-menu>
                  <Button
              onClick={() => setShowColorMenu(!showColorMenu)}
              variant={editor.isActive('textStyle') ? 'secondary' : 'primary'}
                    size="sm"
                    type="button"
              aria-label="Text Color"
              title="Text Color"
              className={`${editor.isActive('textStyle') ? 'is-active dark:bg-gray-700 dark:text-white dark:border-gray-600' : 'dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-300'} flex items-center gap-1`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </Button>

            {showColorMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                {colorOptions.map(({ name, value }) => (
                  <button
                    key={value}
                    onClick={() => handleColorChange(value)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: value === 'inherit' ? 'transparent' : value }}></span>
                    {name}
                  </button>
                ))}
            </div>
            )}
          </div>

          {/* Highlight Dropdown */}
          <div className="relative" data-highlight-menu>
                  <Button
              onClick={() => setShowHighlightMenu(!showHighlightMenu)}
              variant={editor.isActive('highlight') ? 'secondary' : 'primary'}
                    size="sm"
                    type="button"
              aria-label="Highlight Color"
              title="Highlight Color"
              className={`${editor.isActive('highlight') ? 'is-active dark:bg-gray-700 dark:text-white dark:border-gray-600' : 'dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:border-gray-300'} flex items-center gap-1`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l-6 6v3h9l3-3"></path>
                <path d="M22 12l-4.586 4.586a2 2 0 0 1-2.828 0L9 13l3-3 4.586 4.586a2 2 0 0 1 0 2.828L22 12z"></path>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </Button>

            {showHighlightMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                {highlightOptions.map(({ name, value }) => (
                  <button
                    key={value}
                    onClick={() => handleHighlightChange(value)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: value }}></span>
                    {name}
                  </button>
                ))}
            </div>
            )}
          </div>
        </div>
      )}

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

      <style jsx global>{`
        @keyframes toolbarFadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
