import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Upload, Settings } from 'lucide-react';

export default function SharedResourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources & Tools"
        description="Shared resources and tools available to all users"
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Templates
            </CardTitle>
            <CardDescription>
              Access commonly used document templates and forms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Proposal Template</span>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Contract Template</span>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Invoice Template</span>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Data Import/Export
            </CardTitle>
            <CardDescription>
              Import and export customer data, leads, and reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Import Excel File
            </Button>
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Customer Data
            </Button>
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Leads Report
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Tools
            </CardTitle>
            <CardDescription>
              Frequently used tools and utilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Email Template Builder
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Lead Scoring Calculator
            </Button>
            <Button variant="outline" className="w-full justify-start">
              ROI Calculator
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Training Resources</CardTitle>
            <CardDescription>
              Learn how to use the CRM system effectively
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <a href="#" className="text-primary hover:underline">
                Getting Started Guide
              </a>
              <p className="text-muted-foreground text-xs">Basic CRM usage and navigation</p>
            </div>
            <div className="text-sm">
              <a href="#" className="text-primary hover:underline">
                Advanced Features Tutorial
              </a>
              <p className="text-muted-foreground text-xs">Lead management and reporting</p>
            </div>
            <div className="text-sm">
              <a href="#" className="text-primary hover:underline">
                Best Practices Guide
              </a>
              <p className="text-muted-foreground text-xs">Tips for maximizing CRM effectiveness</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
