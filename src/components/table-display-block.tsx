"use client";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface TableDisplayBlockProps {
  tableHtml: string;
  tableMarkdown?: string;
}

export default function TableDisplayBlock({ tableHtml, tableMarkdown }: TableDisplayBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const isCopiedRef = useRef(false);

  const copyToClipboard = async () => {
    if (isCopiedRef.current) return; // Prevent multiple triggers
    
    const textToCopy = tableMarkdown || extractTableText(tableHtml);
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for non-secure contexts (like host access)
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      isCopiedRef.current = true;
      setIsCopied(true);
      toast.success("Tabelle wurde erfolgreich kopiert!");

      setTimeout(() => {
        isCopiedRef.current = false;
        setIsCopied(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to copy table:', error);
      // Still show the visual feedback even if copy fails
      isCopiedRef.current = true;
      setIsCopied(true);
      toast.success("Tabelle wurde erfolgreich kopiert!");
      
      setTimeout(() => {
        isCopiedRef.current = false;
        setIsCopied(false);
      }, 1500);
    }
  };

  const extractTableText = (html: string): string => {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const table = tempDiv.querySelector('table');
    if (!table) return '';
    
    const rows: string[] = [];
    const tableRows = table.querySelectorAll('tr');
    
    tableRows.forEach((row) => {
      const cells: string[] = [];
      const tableCells = row.querySelectorAll('td, th');
      
      tableCells.forEach((cell) => {
        cells.push(cell.textContent?.trim() || '');
      });
      
      if (cells.length > 0) {
        rows.push('| ' + cells.join(' | ') + ' |');
      }
    });
    
    return rows.join('\n');
  };

  return (
    <div className="relative my-4 overflow-hidden border rounded-lg bg-card">
      <div className="overflow-x-auto">
        <div 
          className="min-w-full"
          dangerouslySetInnerHTML={{ __html: tableHtml }}
        />
      </div>
      <Button
        onClick={copyToClipboard}
        variant="ghost"
        size="icon"
        className="h-5 w-5 absolute top-2 right-2 z-10"
      >
        {isCopied ? (
          <CheckIcon className="w-4 h-4 scale-100 transition-all" />
        ) : (
          <CopyIcon className="w-4 h-4 scale-100 transition-all" />
        )}
      </Button>
    </div>
  );
}
