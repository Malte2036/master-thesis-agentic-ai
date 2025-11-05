'use client';

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
            <svg
              className="h-10 w-10 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
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
            <svg
              className="h-10 w-10 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
