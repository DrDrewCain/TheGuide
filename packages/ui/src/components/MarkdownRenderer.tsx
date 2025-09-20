import * as React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { cn } from '../lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Configure marked for better styling
marked.setOptions({
  gfm: true,
  breaks: true,
});

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const [html, setHtml] = React.useState('');

  React.useEffect(() => {
    const parseMarkdown = async () => {
      try {
        const rawHtml = await marked(content);
        const sanitizedHtml = DOMPurify.sanitize(rawHtml);
        setHtml(sanitizedHtml);
      } catch (error) {
        console.error('Error parsing markdown:', error);
        // Never inject raw content. Sanitize the fallback as well.
        setHtml(DOMPurify.sanitize(content));
      }
    };

    parseMarkdown();
  }, [content]);

  return (
    <div
      className={cn(
        'prose prose-slate max-w-none',
        'prose-headings:font-semibold prose-headings:text-slate-900',
        'prose-p:text-slate-600 prose-p:leading-relaxed',
        'prose-strong:text-slate-900 prose-strong:font-semibold',
        'prose-ul:text-slate-600 prose-li:text-slate-600',
        'prose-code:text-slate-800 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
        'prose-pre:bg-slate-900 prose-pre:text-slate-100',
        'prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}