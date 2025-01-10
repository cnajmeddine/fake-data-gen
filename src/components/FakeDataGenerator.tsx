'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { X } from 'lucide-react';
import FileUpload from './FileUpload';
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 10;

export default function FakeDataGenerator() {
  const [activeTab, setActiveTab] = useState('premade');
  const [fields, setFields] = useState<string[]>([]);
  const [newField, setNewField] = useState('');
  const [rowCount, setRowCount] = useState(10);
  const [generatedData, setGeneratedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [customPrompt, setCustomPrompt] = useState('');
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [sampleHeaders, setSampleHeaders] = useState<string[]>([]);
  const [datasetContext, setDatasetContext] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fieldOptions = [
    'firstName', 'lastName', 'email', 'phoneNumber', 
    'companyName', 'address', 'city', 'country',
    'latitude', 'longitude', 'creditCardNumber', 'dateOfBirth'
  ];

  const handleFileData = (data: any[], headers: string[], context: string) => {
    setSampleData(data);
    setSampleHeaders(headers);
    setFields(headers);
    setDatasetContext(context);
    setError(null);
  };

  const addField = () => {
    if (newField && !fields.includes(newField)) {
      setFields([...fields, newField]);
      setNewField('');
      setError(null);
    }
  };

  const removeField = (fieldToRemove: string) => {
    setFields(fields.filter(field => field !== fieldToRemove));
  };

  const generateData = async () => {
    setLoading(true);
    setError(null);
    try {
      let promptContent = '';
      
      if (activeTab === 'custom') {
        if (!customPrompt.trim()) {
          throw new Error('Please enter a custom prompt');
        }
        //promptContent = customPrompt;
        promptContent = `${customPrompt}

        Important: Return ONLY a JSON array of objects based on the context above. Do not include any explanations or additional text.`;
      } else if (activeTab === 'dataset' && sampleData.length > 0) {
        if (!datasetContext.trim()) {
          throw new Error('Please provide context for your dataset');
        }
        promptContent = `Context: ${datasetContext}
          Sample data: ${JSON.stringify(sampleData.slice(0, 3))}
          
          Based on the context and sample data above, generate ${rowCount} new, unique rows that follow the exact same patterns, constraints, and style as the sample data.
          
          Important: Return ONLY a JSON array of objects with the same structure as the sample data. Do not include any explanations or additional text.`;
      } else {
        if (fields.length === 0) {
          throw new Error('Please select at least one field');
        }
        promptContent = `Generate a fake dataset with the following fields: ${fields.join(', ')}. 
          I want ${rowCount} rows of fake data. Return ONLY a JSON array of objects.`;
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptContent,
          rowCount,
        }),
      });
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setGeneratedData(data);
      setCurrentPage(1);
    } catch (error: any) {
      console.error('Error generating data:', error);
      setError(error.message || 'An error occurred while generating data');
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
    if (!generatedData.length) return;
    
    const worksheet = XLSX.utils.json_to_sheet(generatedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Generated Data");
    XLSX.writeFile(workbook, "generated-data.xlsx");
  };

  const totalPages = Math.ceil(generatedData.length / ITEMS_PER_PAGE);
  const paginatedData = generatedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Fake Data Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="premade">Premade Dataset</TabsTrigger>
              <TabsTrigger value="dataset">Custom Dataset</TabsTrigger>
              <TabsTrigger value="custom">Custom Prompt</TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="premade" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="dataset" className="space-y-4">
              <FileUpload onDataLoaded={handleFileData} />
              {sampleData.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Sample data loaded with fields: {sampleHeaders.join(', ')}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <Textarea
                placeholder="Enter your custom prompt here..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </TabsContent>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Rows</label>
                <Input
                  type="number"
                  value={rowCount}
                  onChange={e => setRowCount(parseInt(e.target.value) || 10)}
                  min="1"
                  max="100"
                  className="w-32"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={generateData} 
                  disabled={loading || (activeTab === 'premade' && !fields.length)}
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
          </Tabs>
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
                  {paginatedData.map((row, index) => (
                    <TableRow key={index}>
                      {fields.map(field => (
                        <TableCell key={field}>{row[field]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="py-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}