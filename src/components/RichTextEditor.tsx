import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TableEditor } from '@/components/TableEditor';
import { Table, Type } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

interface TableData {
  id: string;
  data: string[][];
  position: number;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  className,
  readOnly = false
}: RichTextEditorProps) {
  const [tables, setTables] = useState<TableData[]>(() => {
    // Parse existing tables from value on initialization
    const tableMatches = Array.from(value.matchAll(/\[TABLE:([^:]+):([^\]]+)\]/g));
    return tableMatches.map(match => {
      const tableId = match[1];
      const tableDataStr = match[2];
      try {
        const data = JSON.parse(decodeURIComponent(tableDataStr));
        return {
          id: tableId,
          data,
          position: match.index || 0
        };
      } catch {
        return {
          id: tableId,
          data: [['']],
          position: match.index || 0
        };
      }
    });
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTableAtCursor = (rows: number = 3, cols: number = 3) => {
    if (readOnly) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const tableData = Array(rows).fill(null).map(() => Array(cols).fill(''));
    
    const newTable: TableData = {
      id: `table-${Date.now()}`,
      data: tableData,
      position: cursorPosition
    };

    // Encode table data in the marker
    const encodedData = encodeURIComponent(JSON.stringify(tableData));
    const tableMarker = `\n[TABLE:${newTable.id}:${encodedData}]\n`;
    const newText = value.slice(0, cursorPosition) + tableMarker + value.slice(cursorPosition);
    
    setTables(prev => [...prev, newTable]);
    onChange?.(newText);
  };

  const handleTableChange = (tableId: string, newData: string[][]) => {
    if (readOnly) return;
    
    setTables(prev => 
      prev.map(table => 
        table.id === tableId ? { ...table, data: newData } : table
      )
    );

    // Update the text with new table data
    const encodedData = encodeURIComponent(JSON.stringify(newData));
    const oldMarkerRegex = new RegExp(`\\[TABLE:${tableId}:[^\\]]+\\]`, 'g');
    const newMarker = `[TABLE:${tableId}:${encodedData}]`;
    const newText = value.replace(oldMarkerRegex, newMarker);
    onChange?.(newText);
  };

  const handleRemoveTable = (tableId: string) => {
    if (readOnly) return;
    
    // Remove table marker from text
    const tableMarkerRegex = new RegExp(`\\n?\\[TABLE:${tableId}:[^\\]]+\\]\\n?`, 'g');
    const newText = value.replace(tableMarkerRegex, '');
    
    setTables(prev => prev.filter(table => table.id !== tableId));
    onChange?.(newText);
  };

  const handleTextChange = (newText: string) => {
    if (readOnly) return;
    onChange?.(newText);
  };

  const renderContent = () => {
    // Split content by table markers while preserving the text around them
    const parts = value.split(/(\[TABLE:[^:]+:[^\]]+\])/);
    const elements: JSX.Element[] = [];

    parts.forEach((part, index) => {
      const tableMatch = part.match(/\[TABLE:([^:]+):([^\]]+)\]/);
      
      if (tableMatch) {
        const tableId = tableMatch[1];
        const tableDataStr = tableMatch[2];
        
        try {
          const tableData = JSON.parse(decodeURIComponent(tableDataStr));
          elements.push(
            <div key={`table-${index}`} className="my-4">
              <TableEditor
                initialRows={tableData.length}
                initialColumns={tableData[0]?.length || 0}
                initialData={tableData}
                onTableChange={!readOnly ? (data) => handleTableChange(tableId, data) : undefined}
                onRemove={!readOnly ? () => handleRemoveTable(tableId) : undefined}
              />
            </div>
          );
        } catch {
          // If table data is corrupted, show error
          elements.push(
            <div key={`error-${index}`} className="my-4 p-4 border border-destructive rounded text-destructive">
              [Corrupted Table Data]
            </div>
          );
        }
      } else if (part) {
        // Regular text content
        elements.push(
          <div key={`text-${index}`} className="whitespace-pre-wrap">
            {part}
          </div>
        );
      }
    });

    return elements;
  };

  const hasTableMarkers = value.includes('[TABLE:');

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-center gap-2 mb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => insertTableAtCursor(3, 3)}
            className="flex items-center gap-1"
          >
            <Table className="h-4 w-4" />
            Insert Table
          </Button>
        </div>
      )}
      
      <div className="border border-border rounded-lg">
        {hasTableMarkers ? (
          <div className="p-3 min-h-[150px] bg-background">
            {renderContent()}
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`border-none resize-none min-h-[150px] ${className}`}
          />
        )}
      </div>
    </div>
  );
}