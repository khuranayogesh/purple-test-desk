import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TableEditor } from '@/components/TableEditor';
import { Table, Type } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onInsertTable?: () => void;
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
  onInsertTable 
}: RichTextEditorProps) {
  const [tables, setTables] = useState<TableData[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTableAtCursor = (rows: number, cols: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const tableData = Array(rows).fill(null).map(() => Array(cols).fill(''));
    
    const newTable: TableData = {
      id: `table-${Date.now()}`,
      data: tableData,
      position: cursorPosition
    };

    // Insert table marker in text
    const tableMarker = `\n[TABLE:${newTable.id}]\n`;
    const newText = value.slice(0, cursorPosition) + tableMarker + value.slice(cursorPosition);
    
    setTables(prev => [...prev, newTable]);
    onChange(newText);
  };

  const handleTableChange = (tableId: string, newData: string[][]) => {
    setTables(prev => 
      prev.map(table => 
        table.id === tableId ? { ...table, data: newData } : table
      )
    );
  };

  const handleRemoveTable = (tableId: string) => {
    // Remove table marker from text
    const tableMarker = `[TABLE:${tableId}]`;
    const newText = value.replace(new RegExp(`\\n?\\[TABLE:${tableId}\\]\\n?`, 'g'), '');
    
    setTables(prev => prev.filter(table => table.id !== tableId));
    onChange(newText);
  };

  const renderContent = () => {
    const parts = value.split(/(\[TABLE:[^\]]+\])/);
    const elements: JSX.Element[] = [];

    parts.forEach((part, index) => {
      const tableMatch = part.match(/\[TABLE:([^\]]+)\]/);
      
      if (tableMatch) {
        const tableId = tableMatch[1];
        const table = tables.find(t => t.id === tableId);
        
        if (table) {
          elements.push(
            <div key={index} className="my-4">
              <TableEditor
                initialRows={table.data.length}
                initialColumns={table.data[0]?.length || 0}
                initialData={table.data}
                onTableChange={(data) => handleTableChange(tableId, data)}
                onRemove={() => handleRemoveTable(tableId)}
              />
            </div>
          );
        }
      } else if (part.trim()) {
        elements.push(
          <div key={index} className="whitespace-pre-wrap">
            {part}
          </div>
        );
      }
    });

    return elements;
  };

  return (
    <div className="space-y-4">
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
      
      <div className="border border-border rounded-lg">
        {value.includes('[TABLE:') ? (
          <div className="p-3 min-h-[150px] bg-background">
            {renderContent()}
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`border-none resize-none min-h-[150px] ${className}`}
          />
        )}
      </div>
    </div>
  );
}