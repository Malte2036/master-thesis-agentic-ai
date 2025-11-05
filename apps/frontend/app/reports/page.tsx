'use client';

import { ReportViewer } from '@/components/reports/ReportViewer';
import { Navigation } from '@/components/Navigation';

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <div className="flex-1 bg-zinc-50">
        <ReportViewer />
      </div>
    </div>
  );
}
