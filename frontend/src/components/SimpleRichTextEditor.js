import React, { useState, useRef } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';

const SimpleRichTextEditor = ({ value, onChange, placeholder, rows = 3, label }) => {
  const editorRef = useRef(null);
  const [fontSize, setFontSize] = useState('16');

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    // Trigger onChange with the new HTML content
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleFontSize = (size) => {
    setFontSize(size);
    // Use CSS fontSize instead of deprecated fontSize command
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      range.surroundContents(span);
      handleInput();
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '15px', fontWeight: '500', color: '#374151' }}>
          {label}
        </label>
      )}
      
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
        <button
          type="button"
          onClick={() => execCommand('bold')}
          title="Bold"
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Bold size={16} />
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('italic')}
          title="Italic"
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Italic size={16} />
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('underline')}
          title="Underline"
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Underline size={16} />
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 4px' }} />

        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          title="Align Left"
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <AlignLeft size={16} />
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          title="Align Center"
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <AlignCenter size={16} />
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          title="Align Right"
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <AlignRight size={16} />
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Type size={16} style={{ color: '#6b7280' }} />
          <select
            value={fontSize}
            onChange={(e) => handleFontSize(e.target.value)}
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
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        placeholder={placeholder}
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
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default SimpleRichTextEditor;
