'use client'

import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CodeSquare,
  Undo2,
  Redo2,
  Minus,
} from 'lucide-react'

interface KnowledgeEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
}

export function KnowledgeEditor({
  content,
  onChange,
  placeholder = 'Escribe el contenido del artículo, guía o procedimiento aquí...',
  editable = true,
}: KnowledgeEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'tiptap-content min-h-[360px] p-5 focus:outline-none text-gray-800 leading-relaxed max-w-none prose prose-blue',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  // Synchronize content if modified externally and editor is out of sync
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content || '', { emitUpdate: false })
    }
  }, [content, editor])

  if (!editor) {
    return (
      <div className="border border-gray-200 rounded-xl bg-white p-6 animate-pulse min-h-[400px]">
        <div className="h-8 bg-gray-100 rounded-md w-full mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    )
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    title,
    children,
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors text-xs flex items-center justify-center ${
        disabled
          ? 'text-gray-300 cursor-not-allowed'
          : isActive
          ? 'bg-blue-100 text-blue-700 font-semibold'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-gray-200/90 rounded-xl overflow-hidden bg-white shadow-xs focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all flex flex-col">
      {/* Clean, minimal toolbar */}
      {editable && (
        <div className="border-b border-gray-100 bg-gray-50/70 p-2 flex flex-wrap items-center gap-1">
          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Encabezado 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Encabezado 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Encabezado 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Formats */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Negrita (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Cursiva (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Tachado"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Código en línea"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Lista con viñetas"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Blocks */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Cita"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Bloque de código"
          >
            <CodeSquare className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Línea divisoria"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* History */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Deshacer (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Rehacer (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </ToolbarButton>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 bg-white cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
