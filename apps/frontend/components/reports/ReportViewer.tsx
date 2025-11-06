'use client';

import { useState, useEffect } from 'react';
import { TestCaseCard } from './TestCaseCard';
import { EvaluationReport } from '@master-thesis-agentic-ai/types';
import { AlertCircle, RefreshCw, Clipboard } from 'lucide-react';

export const ReportViewer = () => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, []);

  useEffect(() => {
    // Auto-select first test when report loads
    if (report && report.testEntries.length > 0 && !selectedTest) {
      setSelectedTest(report.testEntries[0].id);
    }
  }, [report, selectedTest]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/report');
      if (!response.ok) {
        throw new Error('Failed to load report');
      }
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = report?.testEntries;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-red-600"></div>
          <p className="text-zinc-600">Loading test report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-600" />
          <h2 className="mb-2 text-xl font-semibold text-red-900">Error Loading Report</h2>
          <p className="mb-4 text-red-700">{error}</p>
          <button
            onClick={loadReport}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-zinc-600">No report data available</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Test Report</h1>
            <p className="text-sm text-zinc-600">
              {report.testEntries.length} test case{report.testEntries.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={loadReport}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content Area - Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Test Cases List */}
        <div className="flex w-96 flex-shrink-0 flex-col border-r border-zinc-200 bg-white">
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {filteredTests?.map((test) => (
              <button
                key={test.id}
                onClick={() => setSelectedTest(test.id)}
                className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                  selectedTest === test.id
                    ? 'border-red-500 bg-red-50 shadow-md'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900">{test.id}</h3>
                    <p className="mt-1 text-xs text-zinc-600">
                      <span className="font-medium">Type:</span> {test.task_type}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                      {test.input}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                      <span>{test.completion_time.toFixed(2)}s</span>
                      <span>•</span>
                      <span>
                        {test.trace?.iterationHistory?.length || 0} iterations
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Summary Stats at Bottom */}
          <div className="border-t border-zinc-200 bg-zinc-50 p-4">
            <div className="space-y-3">
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-zinc-600">Total Tests</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  {report.testEntries.length}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-blue-600">
                  Avg Completion Time
                </p>
                <p className="mt-1 text-2xl font-bold text-blue-900">
                  {(
                    report.testEntries.reduce(
                      (sum, t) => sum + t.completion_time,
                      0,
                    ) / report.testEntries.length
                  ).toFixed(1)}
                  s
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Test Details */}
        <div className="flex-1 overflow-hidden bg-zinc-50">
          {selectedTest ? (
            <TestCaseCard
              test={
                filteredTests?.find((t) => t.id === selectedTest) ||
                filteredTests?.[0]!
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              <div className="text-center">
                <Clipboard className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
                <p className="text-lg">Select a test case to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

