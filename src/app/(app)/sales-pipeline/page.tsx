"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockSales, mockUsers } from "@/lib/mock-data";
import type { Sale, SalesStage } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { PlusCircle, DollarSign, Users, CalendarDays, Percent } from "lucide-react";
import { useMemo } from "react";
import { format } from 'date-fns';

const stages: SalesStage[] = ['Qualification', 'Proposal', 'Closed Won', 'Closed Lost'];

const StageCard = ({ sale }: { sale: Sale }) => {
  const employee = mockUsers.find(u => u.id === sale.assignedEmployeeId);
  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base font-semibold">{sale.customerName || 'Unknown Customer'}</CardTitle>
        <CardDescription className="text-xs">Assigned to: {employee?.name || 'N/A'}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1 text-sm">
        <div className="flex items-center text-muted-foreground">
          <DollarSign className="h-4 w-4 mr-2 text-green-500" /> 
          Amount: ${sale.amount.toLocaleString()}
        </div>
        <div className="flex items-center text-muted-foreground">
          <Percent className="h-4 w-4 mr-2 text-blue-500" />
          Probability: {sale.probability}%
        </div>
        <div className="flex items-center text-muted-foreground">
          <CalendarDays className="h-4 w-4 mr-2 text-purple-500" />
          Close Date: {format(new Date(sale.expectedCloseDate), "MMM d, yyyy")}
        </div>
      </CardContent>
    </Card>
  );
};

export default function SalesPipelinePage() {
  const { user } = useAuth();

  const salesByStage = useMemo(() => {
    const initialSales = user?.role === 'Admin' 
      ? mockSales 
      : mockSales.filter(sale => sale.assignedEmployeeId === user?.id);

    return stages.reduce((acc, stage) => {
      acc[stage] = initialSales.filter(sale => sale.stage === stage);
      return acc;
    }, {} as Record<SalesStage, Sale[]>);
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Pipeline" description="Visualize and manage your sales opportunities.">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Opportunity
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stages.map((stage) => (
          <div key={stage} className="bg-muted/50 p-4 rounded-lg min-h-[300px]">
            <h3 className="text-lg font-semibold mb-4 text-center text-foreground pb-2 border-b-2 border-primary">{stage} ({salesByStage[stage]?.length || 0})</h3>
            <div className="space-y-4 h-[calc(100%-4rem)] overflow-y-auto pr-1">
              {salesByStage[stage] && salesByStage[stage].length > 0 ? (
                salesByStage[stage].map((sale) => <StageCard key={sale.id} sale={sale} />)
              ) : (
                <p className="text-sm text-muted-foreground text-center pt-10">No opportunities in this stage.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
