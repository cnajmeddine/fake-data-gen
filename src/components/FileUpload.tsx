'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onDataLoaded: (data: any[], headers: string[], context: string) => void;
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const data = await readFileData(file);
      const headers = Object.keys(data[0]);
      onDataLoaded(data, headers, context);
    } catch (error) {
      console.error('Error reading file:', error);
    }
    setLoading(false);
  };

  const readFileData = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Dataset Context</label>
        <Textarea
          placeholder="Provide context about your dataset (e.g., 'This is a list of Moroccan cities with their populations' or 'This is medical data about different types of diseases')"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      <Input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        disabled={loading}
      />
      {loading && <p>Loading file...</p>}
    </div>
  );
}