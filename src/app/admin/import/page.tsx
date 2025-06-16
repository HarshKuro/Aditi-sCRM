'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { withRoleAuth } from '@/lib/auth-guards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/shared/page-header';
import { 
  Upload, 
  FileSpreadsheet, 
  Eye, 
  Download, 
  Users, 
  Check, 
  X, 
  AlertTriangle,
  Tag,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ParsedCustomer {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  country?: string;
  visaType?: string;
  [key: string]: any;
}

interface ColumnMapping {
  excelColumn: string;
  fieldName: string;
  selected: boolean;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
}

function ImportPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedCustomer[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [commonTags, setCommonTags] = useState<string>('');
  const [commonCountry, setCommonCountry] = useState<string>('');
  const [commonVisaType, setCommonVisaType] = useState<string>('');
  const [importResults, setImportResults] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch employees for assignment
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an Excel file (.xlsx or .xls)',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      parseExcelFile(selectedFile);
    }
  };

  // Parse Excel file
  const parseExcelFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const data = await file.arrayBuffer();
      setUploadProgress(50);
      
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setUploadProgress(75);
      
      if (jsonData.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
      }

      // Extract headers and data
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];
        // Create parsed customer data
      const customers: ParsedCustomer[] = rows
        .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
        .map((row, index) => {
          const customer: any = {};
          headers.forEach((header, colIndex) => {
            if (header && row[colIndex] !== null && row[colIndex] !== undefined) {
              customer[header] = String(row[colIndex]).trim();
            }
          });
          return customer as ParsedCustomer;
        });

      setColumns(headers);
      setParsedData(customers);
      
      // Initialize column mappings
      const mappings: ColumnMapping[] = headers.map(header => ({
        excelColumn: header,
        fieldName: guessFieldMapping(header),
        selected: ['name', 'email', 'phone', 'company', 'country'].includes(guessFieldMapping(header)),
      }));
      
      setColumnMappings(mappings);
      setUploadProgress(100);
      
      // Fetch employees for assignment
      await fetchEmployees();
      
      toast({
        title: 'File parsed successfully',
        description: `Found ${customers.length} rows of customer data`,
      });

    } catch (error: any) {
      console.error('Error parsing Excel file:', error);
      toast({
        title: 'Parsing failed',
        description: error.message || 'Failed to parse Excel file',
        variant: 'destructive',
      });
      setFile(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Guess field mapping based on column name
  const guessFieldMapping = (columnName: string): string => {
    const name = columnName.toLowerCase();
    if (name.includes('name') || name.includes('full name') || name.includes('customer')) return 'name';
    if (name.includes('email') || name.includes('mail')) return 'email';
    if (name.includes('phone') || name.includes('mobile') || name.includes('contact')) return 'phone';
    if (name.includes('company') || name.includes('organization') || name.includes('business')) return 'company';
    if (name.includes('country') || name.includes('nation')) return 'country';
    if (name.includes('visa') || name.includes('type')) return 'visaType';
    return 'do-not-import';
  };

  // Update column mapping
  const updateColumnMapping = (index: number, field: string) => {
    const updated = [...columnMappings];
    updated[index].fieldName = field;
    updated[index].selected = field !== 'do-not-import';
    setColumnMappings(updated);
  };

  // Toggle column selection
  const toggleColumnSelection = (index: number) => {
    const updated = [...columnMappings];
    updated[index].selected = !updated[index].selected;
    setColumnMappings(updated);
  };

  // Import customers
  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast({
        title: 'No data to import',
        description: 'Please upload and parse an Excel file first',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);

    try {
      // Map data according to column mappings
      const customersToImport = parsedData.map(row => {
        const customer: any = {};
        
        columnMappings.forEach(mapping => {
          if (mapping.selected && mapping.fieldName !== 'other' && row[mapping.excelColumn]) {
            customer[mapping.fieldName] = row[mapping.excelColumn];
          }
        });

        // Add common values
        if (commonCountry && !customer.country) customer.country = commonCountry;
        if (commonVisaType && !customer.visaType) customer.visaType = commonVisaType;
        if (commonTags) customer.tags = commonTags.split(',').map(tag => tag.trim()).filter(Boolean);
        if (selectedEmployee) customer.assignedToId = selectedEmployee;

        return customer;
      });

      const response = await fetch('/api/customers/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customers: customersToImport,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setImportResults(result);
        toast({
          title: 'Import successful',
          description: `Successfully imported ${result.imported} customers`,
        });
      } else {
        throw new Error(result.error || 'Import failed');
      }

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to import customers',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Reset import
  const resetImport = () => {
    setFile(null);
    setParsedData([]);
    setColumns([]);
    setColumnMappings([]);
    setImportResults(null);
    setCommonTags('');
    setCommonCountry('');
    setCommonVisaType('');
    setSelectedEmployee('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Import Customers"
        description="Upload Excel files to import customer data with preview and validation"
      />

      {/* Upload Section */}
      {!file && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Excel File</span>
            </CardTitle>
            <CardDescription>
              Upload an Excel file (.xlsx or .xls) containing customer data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center w-full">
              <label 
                htmlFor="dropzone-file" 
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileSpreadsheet className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">Excel files only (.xlsx, .xls)</p>
                </div>
                <Input
                  ref={fileInputRef}
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="text-sm">Parsing Excel file...</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Info & Column Mapping */}
      {file && parsedData.length > 0 && !importResults && (
        <div className="space-y-6">
          {/* File Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span>File Information</span>
                </div>
                <Button variant="outline" onClick={resetImport}>
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">File Name</p>
                  <p className="font-medium">{file.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rows Found</p>
                  <p className="font-medium">{parsedData.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Columns Found</p>
                  <p className="font-medium">{columns.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Column Mapping */}
          <Card>
            <CardHeader>
              <CardTitle>Column Mapping</CardTitle>
              <CardDescription>
                Map Excel columns to customer fields and select which columns to import
              </CardDescription>
            </CardHeader>            <CardContent>
              <div className="space-y-4">
                {columnMappings && columnMappings.length > 0 && columnMappings.map((mapping, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <Checkbox
                      checked={mapping.selected}
                      onCheckedChange={() => toggleColumnSelection(index)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{mapping.excelColumn}</p>
                      <p className="text-sm text-muted-foreground">
                        Sample: {parsedData[0]?.[mapping.excelColumn] || 'N/A'}
                      </p>
                    </div>
                    <Select
                      value={mapping.fieldName || 'do-not-import'}
                      onValueChange={(value) => updateColumnMapping(index, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="country">Country</SelectItem>
                        <SelectItem value="visaType">Visa Type</SelectItem>
                        <SelectItem value="do-not-import">Don't Import</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Import Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Tag className="h-5 w-5" />
                <span>Import Options</span>
              </CardTitle>
              <CardDescription>
                Set common values and assign customers to employees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="common-country">Common Country</Label>
                  <Input
                    id="common-country"
                    value={commonCountry}
                    onChange={(e) => setCommonCountry(e.target.value)}
                    placeholder="e.g., United States"
                  />
                </div>
                <div>
                  <Label htmlFor="common-visa">Common Visa Type</Label>
                  <Input
                    id="common-visa"
                    value={commonVisaType}
                    onChange={(e) => setCommonVisaType(e.target.value)}
                    placeholder="e.g., H1B, F1, Tourist"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="common-tags">Common Tags (comma-separated)</Label>
                <Input
                  id="common-tags"
                  value={commonTags}
                  onChange={(e) => setCommonTags(e.target.value)}
                  placeholder="e.g., imported, lead, high-priority"
                />
              </div>              <div>
                <Label htmlFor="assign-employee">Assign All To Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Assignment</SelectItem>
                    {employees && employees.length > 0 && employees.map((employee) => (
                      <SelectItem key={employee._id} value={employee._id}>
                        {employee.name} ({employee.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Data Preview</span>
              </CardTitle>
              <CardDescription>
                Preview of the first 5 rows that will be imported
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columnMappings
                        .filter(mapping => mapping.selected)
                        .map((mapping, index) => (
                          <TableHead key={index}>
                            {mapping.fieldName}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              ({mapping.excelColumn})
                            </span>
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 5).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columnMappings
                          .filter(mapping => mapping.selected)
                          .map((mapping, colIndex) => (
                            <TableCell key={colIndex}>
                              {row[mapping.excelColumn] || '-'}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {parsedData.length > 5 && (
                <p className="text-sm text-muted-foreground mt-4">
                  ... and {parsedData.length - 5} more rows
                </p>
              )}
            </CardContent>
          </Card>

          {/* Import Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Ready to import</p>
                  <p className="text-sm text-muted-foreground">
                    {columnMappings.filter(m => m.selected).length} columns selected, {parsedData.length} rows
                  </p>
                </div>
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting}
                  size="lg"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Import {parsedData.length} Customers
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import Results */}
      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Import Complete</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{importResults.imported}</p>
                <p className="text-sm text-green-700">Imported</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{importResults.skipped}</p>
                <p className="text-sm text-yellow-700">Skipped</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{importResults.total}</p>
                <p className="text-sm text-blue-700">Total</p>
              </div>
            </div>

            {importResults.details?.skipped?.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Some rows were skipped:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {importResults.details.skipped.map((skip: any, index: number) => (
                      <li key={index}>
                        Row {skip.row}: {skip.email} - {skip.reason}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-4">
              <Button onClick={resetImport} variant="outline">
                Import Another File
              </Button>
              <Button 
                onClick={() => window.location.href = '/customers'}
                variant="default"
              >
                <Users className="h-4 w-4 mr-2" />
                View Customers
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Protect this page - Admin only
export default withRoleAuth(ImportPage, {
  allowedRoles: ['Admin'],
  redirectTo: '/unauthorized'
});
