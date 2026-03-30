'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold, Italic, Underline, Strikethrough, Code, Link2,
  List, ListOrdered, AtSign, Hash, Smile, Send
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  placeholder?: string;
  maxLength?: number;
  showFormatting?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onSend,
  placeholder = 'Type a message...',
  maxLength,
  showFormatting = true,
}) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (formatType: string, wrapper: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);
    
    const formattedText = `${beforeText}${wrapper}${selectedText}${wrapper}${afterText}`;
    onChange(formattedText);

    // Restore selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + wrapper.length, end + wrapper.length);
    }, 0);
  };

  const FormatButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }> = ({ icon, label, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={label}
    >
      {icon}
    </motion.button>
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSend?.();
    }
    
    // Cmd/Ctrl + B for bold
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      applyFormat('bold', '**');
    }
    
    // Cmd/Ctrl + I for italic
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      applyFormat('italic', '*');
    }
    
    // Cmd/Ctrl + U for underline
    if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
      e.preventDefault();
      applyFormat('underline', '__');
    }
  };

  return (
    <div className="relative">
      {/* Formatting Toolbar */}
      <AnimatePresence>
        {showToolbar && showFormatting && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex items-center gap-1"
          >
            <FormatButton
              icon={<Bold className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
              label="Bold (⌘B)"
              onClick={() => applyFormat('bold', '**')}
            />
            <FormatButton
              icon={<Italic className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
              label="Italic (⌘I)"
              onClick={() => applyFormat('italic', '*')}
            />
            <FormatButton
              icon={<Underline className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
              label="Underline (⌘U)"
              onClick={() => applyFormat('underline', '__')}
            />
            <FormatButton
              icon={<Strikethrough className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
              label="Strikethrough"
              onClick={() => applyFormat('strikethrough', '~~')}
            />
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            <FormatButton
              icon={<Code className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
              label="Code"
              onClick={() => applyFormat('code', '`')}
            />
            <FormatButton
              icon={<Link2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
              label="Link"
              onClick={() => applyFormat('link', '[](url)')}
            />
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            <FormatButton
              icon={<List className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
              label="Bullet List"
              onClick={() => onChange(value + '\n- ')}
            />
            <FormatButton
              icon={<ListOrdered className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
              label="Numbered List"
              onClick={() => onChange(value + '\n1. ')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowToolbar(true)}
          onBlur={() => setTimeout(() => setShowToolbar(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full px-4 py-3 pr-32 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[44px] max-h-32"
          rows={1}
          style={{
            height: 'auto',
            minHeight: '44px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
          }}
        />

        {/* Quick Actions */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          {maxLength && (
            <span className={`text-xs ${value.length > maxLength * 0.9 ? 'text-red-500' : 'text-gray-400'}`}>
              {value.length}/{maxLength}
            </span>
          )}
          
          {onSend && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSend}
              disabled={!value.trim()}
              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Format Hint */}
      {showToolbar && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 px-2"
        >
          <span className="font-mono">**bold**</span> <span className="font-mono">*italic*</span> <span className="font-mono">`code`</span> • ⌘⏎ to send
        </motion.p>
      )}
    </div>
  );
};
