import React, { useState } from 'react';
import { Button } from './ui/button';
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

interface CodeDisplayBlockProps {
  code: string;
  language?: string;
  className?: string;
}

const CodeDisplayBlock: React.FC<CodeDisplayBlockProps> = ({
  code,
  language = 'text',
  className,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className={cn("relative group", className)}>
      <div className="flex items-center justify-between p-2 bg-muted rounded-t-md">
        <span className="text-xs text-muted-foreground font-mono">
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isCopied ? (
            <CheckIcon className="h-3 w-3" />
          ) : (
            <CopyIcon className="h-3 w-3" />
          )}
        </Button>
      </div>
      <pre className="bg-muted p-4 rounded-b-md overflow-x-auto">
        <code className="text-sm font-mono whitespace-pre-wrap">
          {code}
        </code>
      </pre>
    </div>
  );
};

export default CodeDisplayBlock;
