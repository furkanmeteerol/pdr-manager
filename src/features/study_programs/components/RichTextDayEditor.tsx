import React, { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2
} from 'lucide-react';

interface RichTextDayEditorProps {
  dayLabel: string;
  dayBadgeColor?: string;
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: string;
}

export const RichTextDayEditor: React.FC<RichTextDayEditorProps> = ({
  dayLabel,
  dayBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200',
  value,
  onChange,
  placeholder = 'Ders, konu veya hedef yazın...',
  readOnly = false,
  minHeight = '140px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Sync value from props into contentEditable innerHTML when changed externally
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current || !onChange) return;
    isInternalUpdate.current = true;
    let html = editorRef.current.innerHTML;
    // Clean up empty tags
    if (html === '<p><br></p>' || html === '<br>' || html === '<div><br></div>') {
      html = '';
    }
    onChange(html);
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    if (readOnly) return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  if (readOnly) {
    const hasContent = Boolean(value && value.trim() !== '' && value !== '<p><br></p>');
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-full">
        <div className={`px-3 py-1.5 font-bold text-xs border-b border-slate-100 flex items-center justify-between ${dayBadgeColor}`}>
          <span>{dayLabel}</span>
        </div>
        <div
          className="p-3 text-xs text-slate-700 overflow-y-auto leading-relaxed flex-1 prose prose-xs max-w-none study-plan-rich-content"
          style={{ minHeight }}
        >
          {hasContent ? (
            <div dangerouslySetInnerHTML={{ __html: value }} />
          ) : (
            <span className="text-slate-400 italic">Plan girilmemiş</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all h-full">
      {/* Day Header */}
      <div className={`px-3 py-1.5 font-bold text-xs border-b border-slate-200/80 flex items-center justify-between ${dayBadgeColor}`}>
        <span className="tracking-wide uppercase text-[11px] font-black">{dayLabel}</span>
      </div>

      {/* Mini Rich Text Toolbar */}
      <div className="bg-slate-50/90 px-2 py-1 border-b border-slate-200/70 flex flex-wrap items-center gap-0.5 select-none">
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); exec('bold'); }}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
          title="Kalın (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); exec('italic'); }}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
          title="İtalik (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); exec('underline'); }}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
          title="Altı Çizili (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-slate-300 mx-0.5" />

        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
          title="Madde İmleri"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
          title="Numaralı Liste"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-slate-300 mx-0.5" />

        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft'); }}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
          title="Sola Hizala"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter'); }}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
          title="Ortala"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); exec('justifyRight'); }}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
          title="Sağa Hizala"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-slate-300 mx-0.5" />

        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); exec('undo'); }}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
          title="Geri Al (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => { e.preventDefault(); exec('redo'); }}
          className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
          title="Yinele (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="p-3 text-xs text-slate-800 focus:outline-none overflow-y-auto leading-relaxed flex-1 relative study-plan-rich-content empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
        style={{ minHeight }}
      />
    </div>
  );
};
