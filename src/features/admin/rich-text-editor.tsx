'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import {
  Bold,
  ImagePlus,
  Italic,
  Link2,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { mediaUrl } from '@/lib/utils/media';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

const FONT_SIZES = ['14px', '16px', '20px', '28px'];
const IMAGE_WIDTHS = ['25%', '50%', '75%', '100%'];

const ResizableImage = Image.extend({
  addAttributes() {
    const parent = this.parent?.() ?? {};
    return {
      ...parent,
      width: {
        default: null,
        parseHTML: (element: HTMLElement): string | null =>
          element.style.width || element.getAttribute('width') || null,
        renderHTML: (attributes: { width?: string | null }) =>
          attributes.width
            ? { style: `width:${attributes.width};height:auto;` }
            : {},
      },
    };
  },
});

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const entry = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return entry?.slice(name.length + 1);
}

async function ensureCsrf(): Promise<string | undefined> {
  const existing = readCookie('csrf_token');
  if (existing) {
    return existing;
  }
  try {
    const response = await fetch(`${API_BASE}/auth/csrf`, {
      credentials: 'include',
    });
    const data = (await response.json()) as { csrfToken?: string };
    return data.csrfToken;
  } catch {
    return undefined;
  }
}

async function uploadImage(file: File): Promise<string> {
  const csrf = await ensureCsrf();
  const form = new FormData();
  form.append('file', file);
  const headers: Record<string, string> = {};
  if (csrf) {
    headers['X-CSRF-Token'] = csrf;
  }
  const response = await fetch(`${API_BASE}/admin/media`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: form,
  });
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  const data = (await response.json()) as { url: string };
  return mediaUrl(data.url) ?? data.url;
}

interface ToolbarButtonProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}

function ToolbarButton({ active, onClick, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active ?? false}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded border p-1.5 text-sm ${
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      TextStyle,
      FontSize,
      ResizableImage.configure({
        inline: false,
        HTMLAttributes: { class: 'max-w-full h-auto' },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'min-h-40 rounded-b-md border border-t-0 border-black/15 px-3 py-2 focus:outline-none dark:border-white/20 prose dark:prose-invert max-w-none',
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-40 rounded-md border border-black/15 dark:border-white/20" />
    );
  }

  function setLink(current: Editor): void {
    const previous = current.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previous ?? 'https://');
    if (url === null) {
      return;
    }
    if (url === '') {
      current.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    current
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  }

  async function onPickImage(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      const src = await uploadImage(file);
      editor?.chain().focus().setImage({ src }).run();
    } catch {
      window.alert('Не вдалося завантажити зображення');
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-black/15 bg-black/5 px-2 py-2 dark:border-white/20 dark:bg-white/5">
        <ToolbarButton
          title="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          title="Link"
          active={editor.isActive('link')}
          onClick={() => setLink(editor)}
        >
          <Link2 className="size-4" aria-hidden />
        </ToolbarButton>
        <select
          aria-label="Font size"
          className="rounded border border-black/15 px-2 py-1 text-sm dark:border-white/20"
          value={(editor.getAttributes('textStyle').fontSize as string) ?? ''}
          onChange={(event) => {
            const size = event.target.value;
            if (size) {
              editor.chain().focus().setFontSize(size).run();
            } else {
              editor.chain().focus().unsetFontSize().run();
            }
          }}
        >
          <option value="">Size</option>
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <button
          type="button"
          title="Insert image"
          aria-label="Insert image"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded border border-black/15 px-2 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          <ImagePlus className="size-4" aria-hidden />
          Image
        </button>
        {editor.isActive('image') ? (
          <select
            aria-label="Image width"
            className="rounded border border-black/15 px-2 py-1 text-sm dark:border-white/20"
            value={(editor.getAttributes('image').width as string) ?? ''}
            onChange={(event) =>
              editor
                .chain()
                .focus()
                .updateAttributes('image', { width: event.target.value })
                .run()
            }
          >
            <option value="">Width</option>
            {IMAGE_WIDTHS.map((width) => (
              <option key={width} value={width}>
                {width}
              </option>
            ))}
          </select>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void onPickImage(event)}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
