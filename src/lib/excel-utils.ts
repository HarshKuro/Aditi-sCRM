import * as XLSX from 'xlsx';
import { z } from 'zod';

// Schema for validating customer data from Excel
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['Lead', 'Prospect', 'Customer', 'Inactive']).default('Lead'),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerData = z.infer<typeof customerSchema>;

export interface ImportResult {
  success: boolean;
  data?: CustomerData[];
  errors?: string[];
  totalRows?: number;
  validRows?: number;
}

export function parseExcelFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve({
            success: false,
            errors: ['Excel file is empty'],
          });
          return;
        }
        
        // Assume first row is headers
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        
        const results: CustomerData[] = [];
        const errors: string[] = [];
          rows.forEach((row: unknown, index: number) => {
          try {
            const rowArray = row as any[];
            // Create object from row data
            const rowData: any = {};
            headers.forEach((header, i) => {
              if (rowArray[i] !== undefined && rowArray[i] !== null && rowArray[i] !== '') {
                // Normalize header names
                const normalizedHeader = header.toLowerCase().trim();
                if (normalizedHeader.includes('name')) {
                  rowData.name = rowArray[i];
                } else if (normalizedHeader.includes('email')) {
                  rowData.email = rowArray[i];
                } else if (normalizedHeader.includes('phone')) {
                  rowData.phone = rowArray[i];
                } else if (normalizedHeader.includes('company')) {
                  rowData.company = rowArray[i];
                } else if (normalizedHeader.includes('status')) {
                  rowData.status = rowArray[i];
                } else if (normalizedHeader.includes('source')) {
                  rowData.source = rowArray[i];
                } else if (normalizedHeader.includes('note')) {
                  rowData.notes = rowArray[i];
                }
              }
            });
            
            // Validate with Zod
            const validatedData = customerSchema.parse(rowData);
            results.push(validatedData);
            
          } catch (error) {
            if (error instanceof z.ZodError) {
              const errorMessages = error.errors.map(e => `Row ${index + 2}: ${e.path.join('.')} - ${e.message}`);
              errors.push(...errorMessages);
            } else {
              errors.push(`Row ${index + 2}: Invalid data format`);
            }
          }
        });
        
        resolve({
          success: true,
          data: results,
          errors: errors.length > 0 ? errors : undefined,
          totalRows: rows.length,
          validRows: results.length,
        });
        
      } catch (error) {
        resolve({
          success: false,
          errors: ['Failed to parse Excel file. Please ensure it\'s a valid Excel format.'],
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        errors: ['Failed to read file'],
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel(data: any[], filename: string = 'export.xlsx') {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Save file
  XLSX.writeFile(workbook, filename);
}

// Template for customer import
export const customerImportTemplate = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    company: 'Acme Corp',
    status: 'Lead',
    source: 'Website',
    notes: 'Interested in our premium package',
  },
  {
    name: 'Jane Smith',
    email: 'jane@company.com',
    phone: '+1-555-0456',
    company: 'Tech Solutions Inc',
    status: 'Prospect',
    source: 'Referral',
    notes: 'Follow up next week',
  },
];

export function downloadTemplate() {
  exportToExcel(customerImportTemplate, 'customer-import-template.xlsx');
}
