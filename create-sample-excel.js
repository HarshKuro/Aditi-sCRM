const XLSX = require('xlsx');
const path = require('path');

// Sample customer data
const customers = [
  { Name: 'John Doe', Email: 'john.doe@email.com', Phone: '+1-555-0123', Company: 'Acme Corp', Country: 'United States', 'Visa Type': 'H1B' },
  { Name: 'Jane Smith', Email: 'jane.smith@email.com', Phone: '+1-555-0124', Company: 'Tech Solutions', Country: 'Canada', 'Visa Type': 'Work Permit' },
  { Name: 'Bob Johnson', Email: 'bob.johnson@email.com', Phone: '+1-555-0125', Company: 'Global Inc', Country: 'United Kingdom', 'Visa Type': 'Tier 2' },
  { Name: 'Alice Brown', Email: 'alice.brown@email.com', Phone: '+1-555-0126', Company: 'StartupXYZ', Country: 'Australia', 'Visa Type': 'Skilled Worker' },
  { Name: 'Mike Wilson', Email: 'mike.wilson@email.com', Phone: '+1-555-0127', Company: 'Enterprise Ltd', Country: 'Germany', 'Visa Type': 'Blue Card' },
  { Name: 'Sarah Davis', Email: 'sarah.davis@email.com', Phone: '+1-555-0128', Company: 'Innovation Hub', Country: 'France', 'Visa Type': 'Talent Passport' },
  { Name: 'Tom Miller', Email: 'tom.miller@email.com', Phone: '+1-555-0129', Company: 'Digital Corp', Country: 'Japan', 'Visa Type': 'Working Holiday' },
  { Name: 'Lisa Garcia', Email: 'lisa.garcia@email.com', Phone: '+1-555-0130', Company: 'Cloud Systems', Country: 'Singapore', 'Visa Type': 'Employment Pass' },
  { Name: 'David Rodriguez', Email: 'david.rodriguez@email.com', Phone: '+1-555-0131', Company: 'AI Solutions', Country: 'India', 'Visa Type': 'L1 Visa' },
  { Name: 'Maria Martinez', Email: 'maria.martinez@email.com', Phone: '+1-555-0132', Company: 'Blockchain Inc', Country: 'Brazil', 'Visa Type': 'Tourist' }
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(customers);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Customers');

// Write file
const filePath = path.join(__dirname, 'sample-customers.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`Sample Excel file created at: ${filePath}`);
