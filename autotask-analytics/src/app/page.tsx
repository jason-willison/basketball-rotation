'use client';

import { Header } from '@/components/layout/Header';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { StaffGrid } from '@/components/dashboard/StaffGrid';
import { AlertPanel } from '@/components/dashboard/AlertPanel';
import { HoursTrendChart } from '@/components/dashboard/Charts/HoursTrendChart';
import { BillabilityChart } from '@/components/dashboard/Charts/BillabilityChart';

// Import mock data
import {
  mockStaff,
  mockTimeEntries,
  mockDashboardMetrics,
  mockAlerts
} from '@/data/mockData';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        metrics={mockDashboardMetrics} 
        alertCount={mockAlerts.length}
      />
      
      {/* Main Content */}
      <main className="px-6 py-6 space-y-6">
        {/* Key Metrics */}
        <MetricsCards metrics={mockDashboardMetrics} />
        
        {/* Staff Performance Grid */}
        <StaffGrid 
          timeEntries={mockTimeEntries}
          staff={mockStaff}
        />
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HoursTrendChart />
          <BillabilityChart 
            billableHours={mockDashboardMetrics.billable_hours}
            totalHours={mockDashboardMetrics.total_hours}
          />
        </div>
        
        {/* Alerts Panel */}
        <AlertPanel alerts={mockAlerts} />
      </main>
    </div>
  );
}