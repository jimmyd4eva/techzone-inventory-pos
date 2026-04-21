import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';

const SimpleRichTextEditor = ({ value, onChange, placeholder, rows = 3 }) => {
  const editorRef = useRef(null);
  const [fontSize, setFontSize] = useState('16');

  // Sync external value -> editor DOM only when the editor is not focused
  // (prevents caret jumps during typing).
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const isActive = document.activeElement === el;
    if (!isActive && (value || '') !== el.innerHTML) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const emitChange = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, commandValue = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const handleInput = () => emitChange();

  const handleFontSize = (size) => {
    setFontSize(size);
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return; // nothing selected

    try {
      // Works when the selection is within a single container
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      range.surroundContents(span);
    } catch {
      // Fallback for complex selections spanning multiple nodes
      const contents = range.extractContents();
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      span.appendChild(contents);
      range.insertNode(span);
    }
    emitChange();
  };

  const btnStyle = {
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  };

  return (
    <div style={{ marginBottom: '4px' }} data-testid="rich-text-editor">
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '8px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px 8px 0 0',
        border: '1px solid #d1d5db',
        borderBottom: 'none',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('bold')} title="Bold" style={btnStyle} data-testid="rte-bold">
          <Bold size={16} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('italic')} title="Italic" style={btnStyle} data-testid="rte-italic">
          <Italic size={16} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('underline')} title="Underline" style={btnStyle} data-testid="rte-underline">
          <Underline size={16} />
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 4px' }} />

        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('justifyLeft')} title="Align Left" style={btnStyle} data-testid="rte-align-left">
          <AlignLeft size={16} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('justifyCenter')} title="Align Center" style={btnStyle} data-testid="rte-align-center">
          <AlignCenter size={16} />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('justifyRight')} title="Align Right" style={btnStyle} data-testid="rte-align-right">
          <AlignRight size={16} />
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Type size={16} style={{ color: '#6b7280' }} />
          <select
            value={fontSize}
            onChange={(e) => handleFontSize(e.target.value)}
            data-testid="rte-font-size"
            style={{
              padding: '4px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
            <option value="28">28px</option>
            <option value="32">32px</option>
          </select>
        </div>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 4px' }} />

        <input
          type="color"
          onChange={(e) => execCommand('foreColor', e.target.value)}
          title="Text Color"
          data-testid="rte-color"
          style={{
            width: '32px',
            height: '32px',
            padding: '2px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          defaultValue="#000000"
        />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-testid="rte-editable"
        data-placeholder={placeholder}
        style={{
          minHeight: `${rows * 24}px`,
          padding: '12px 16px',
          border: '1px solid #d1d5db',
          borderRadius: '0 0 8px 8px',
          fontSize: '16px',
          lineHeight: '1.5',
          outline: 'none',
          backgroundColor: '#fff',
          overflow: 'auto'
        }}
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default SimpleRichTextEditor;
