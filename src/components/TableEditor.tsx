import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';

interface TableEditorProps {
  initialRows?: number;
  initialColumns?: number;
  onTableChange?: (tableData: string[][]) => void;
  onRemove?: () => void;
}

export function TableEditor({ 
  initialRows = 3, 
  initialColumns = 3, 
  onTableChange,
  onRemove 
}: TableEditorProps) {
  const [tableData, setTableData] = useState<string[][]>(() => {
    const data: string[][] = [];
    for (let i = 0; i < initialRows; i++) {
      const row: string[] = [];
      for (let j = 0; j < initialColumns; j++) {
        row.push(i === 0 ? `Header ${j + 1}` : '');
      }
      data.push(row);
    }
    return data;
  });

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...tableData];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
    onTableChange?.(newData);
  };

  const addRow = () => {
    const newRow = new Array(tableData[0]?.length || 1).fill('');
    const newData = [...tableData, newRow];
    setTableData(newData);
    onTableChange?.(newData);
  };

  const addColumn = () => {
    const newData = tableData.map(row => [...row, '']);
    setTableData(newData);
    onTableChange?.(newData);
  };

  const removeRow = (index: number) => {
    if (tableData.length > 1) {
      const newData = tableData.filter((_, i) => i !== index);
      setTableData(newData);
      onTableChange?.(newData);
    }
  };

  const removeColumn = (index: number) => {
    if (tableData[0]?.length > 1) {
      const newData = tableData.map(row => row.filter((_, i) => i !== index));
      setTableData(newData);
      onTableChange?.(newData);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-background">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">Table Editor</h4>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-3 w-3 mr-1" />
            Row
          </Button>
          <Button variant="outline" size="sm" onClick={addColumn}>
            <Plus className="h-3 w-3 mr-1" />
            Column
          </Button>
          {onRemove && (
            <Button variant="outline" size="sm" onClick={onRemove}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border border-border p-1 min-w-[120px]">
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className={`h-8 text-sm border-none bg-transparent ${
                        rowIndex === 0 ? 'font-medium bg-muted/50' : ''
                      }`}
                      placeholder={rowIndex === 0 ? 'Header' : 'Cell data'}
                    />
                  </td>
                ))}
                <td className="p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(rowIndex)}
                    disabled={tableData.length <= 1}
                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
            <tr>
              {tableData[0]?.map((_, colIndex) => (
                <td key={colIndex} className="p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeColumn(colIndex)}
                    disabled={tableData[0]?.length <= 1}
                    className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              ))}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}