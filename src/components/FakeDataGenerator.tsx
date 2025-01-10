'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X } from 'lucide-react';

const FakeDataGenerator = () => {
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState('');
  const [rowCount, setRowCount] = useState(10);
  const [generatedData, setGeneratedData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fieldOptions = [
    'firstName', 'lastName', 'email', 'phoneNumber', 
    'companyName', 'address', 'city', 'country',
    'latitude', 'longitude', 'creditCardNumber', 'dateOfBirth'
  ];

  const addField = () => {
    if (newField && !fields.includes(newField)) {
      setFields([...fields, newField]);
      setNewField('');
    }
  };

  const removeField = (fieldToRemove) => {
    setFields(fields.filter(field => field !== fieldToRemove));
  };

  const generateData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields,
          rowCount,
        }),
      });
      const data = await response.json();
      setGeneratedData(data);
    } catch (error) {
      console.error('Error generating data:', error);
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    if (!generatedData.length) return;
    
    const headers = fields.join(',');
    const rows = generatedData.map(row => 
      fields.map(field => `"${row[field]}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    // Similar to CSV but with xlsx format
    // You'll need to add xlsx library for proper Excel export
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Fake Data Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Fields</label>
              <div className="flex gap-2">
                <Select value={newField} onValueChange={setNewField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addField}>Add Field</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {fields.map(field => (
                  <Badge key={field} variant="secondary" className="px-3 py-1">
                    {field}
                    <X 
                      className="ml-2 h-4 w-4 cursor-pointer" 
                      onClick={() => removeField(field)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Rows</label>
              <Input
                type="number"
                value={rowCount}
                onChange={e => setRowCount(parseInt(e.target.value))}
                min="1"
                max="100"
                className="w-32"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={generateData} 
                disabled={!fields.length || loading}
              >
                {loading ? 'Generating...' : 'Generate Data'}
              </Button>
              {generatedData.length > 0 && (
                <>
                  <Button onClick={downloadCSV} variant="outline">
                    Download CSV
                  </Button>
                  <Button onClick={downloadExcel} variant="outline">
                    Download Excel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {generatedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {fields.map(field => (
                      <TableHead key={field}>{field}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedData.map((row, index) => (
                    <TableRow key={index}>
                      {fields.map(field => (
                        <TableCell key={field}>{row[field]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FakeDataGenerator;