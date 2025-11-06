'use client';

import { Clipboard, Clock } from 'lucide-react';

type ReportSummaryProps = {
  totalTests: number;
  avgCompletionTime: number;
};

export const ReportSummary = ({
  totalTests,
  avgCompletionTime,
}: ReportSummaryProps) => {
  return (
    <div className="border-b border-zinc-200 bg-white px-6 py-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Total Tests */}
        <div className="rounded-lg bg-zinc-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600">Total Tests</p>
              <p className="mt-1 text-3xl font-bold text-zinc-900">
                {totalTests}
              </p>
            </div>
            <Clipboard className="h-10 w-10 text-zinc-400" />
          </div>
        </div>

        {/* Avg Completion Time */}
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Avg Completion Time
              </p>
              <p className="mt-1 text-3xl font-bold text-blue-900">
                {avgCompletionTime.toFixed(1)}s
              </p>
            </div>
            <Clock className="h-10 w-10 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
