'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, FileWarning, TrendingDown, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorReportDashboardProps {
  documents: any[];
}

export default function ErrorReportDashboard({ documents }: ErrorReportDashboardProps) {
  const [errorStats, setErrorStats] = useState({
    totalErrors: 0,
    errorTypes: {} as Record<string, number>,
    topErrorFields: [] as Array<{ field: string; count: number }>,
    failedDocuments: [] as any[],
    errorTrend: [] as Array<{ date: string; errors: number }>
  });

  useEffect(() => {
    if (documents && documents.length > 0) {
      const failedDocs = documents.filter(d => d.status === 'FAILED');
      const docsWithErrors = documents.filter(d => 
        d.validationLog && (!d.validationLog.isValid || d.validationLog.warnings?.length > 0)
      );

      const errorTypes: Record<string, number> = {};
      const errorFields: Record<string, number> = {};

      docsWithErrors.forEach(doc => {
        if (doc.validationLog?.missingFields) {
          doc.validationLog.missingFields.forEach((field: string) => {
            errorTypes['Missing Field'] = (errorTypes['Missing Field'] || 0) + 1;
            errorFields[field] = (errorFields[field] || 0) + 1;
          });
        }
        if (doc.validationLog?.warnings) {
          doc.validationLog.warnings.forEach((warning: string) => {
            if (warning.includes('doesn\'t match')) {
              errorTypes['Total Mismatch'] = (errorTypes['Total Mismatch'] || 0) + 1;
            }
          });
        }
      });

      const topErrorFields: Array<{ field: string; count: number }> = Object.entries(errorFields)
        .map(([field, count]) => ({ field, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const errorTrend = documents
        .filter(d => d.validationLog && !d.validationLog.isValid)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map(doc => ({
          date: new Date(doc.createdAt).toLocaleDateString(),
          errors: 1
        }))
        .reduce((acc: any, curr) => {
          const existing = acc.find((item: any) => item.date === curr.date);
          if (existing) {
            existing.errors++;
          } else {
            acc.push(curr);
          }
          return acc;
        }, []);

      setErrorStats({
        totalErrors: docsWithErrors.length,
        errorTypes,
        topErrorFields,
        failedDocuments: failedDocs,
        errorTrend
      });
    }
  }, [documents]);

  const errorCards = [
    {
      title: 'Documents with Errors',
      value: errorStats.totalErrors,
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: 'Need attention'
    },
    {
      title: 'Failed Extractions',
      value: errorStats.failedDocuments.length,
      icon: XCircle,
      color: 'bg-orange-500',
      description: 'Complete failures'
    },
    {
      title: 'Common Issues',
      value: Object.keys(errorStats.errorTypes).length,
      icon: FileWarning,
      color: 'bg-yellow-500',
      description: 'Unique error types'
    },
    {
      title: 'Success Rate',
      value: `${((documents?.length - errorStats.totalErrors) / documents?.length * 100).toFixed(1)}%`,
      icon: TrendingDown,
      color: 'bg-green-500',
      description: 'Extraction success'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Error Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {errorCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
                <p className="text-xs text-gray-400 mt-2">{card.description}</p>
              </div>
              <div className={`${card.color} p-3 rounded-full`}>
                <card.icon className="text-white" size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Error Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Error Fields */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Common Missing Fields</h3>
          <div className="space-y-3">
            {errorStats.topErrorFields.map((field: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{field.field}</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(field.count / errorStats.totalErrors) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{field.count}</span>
                </div>
              </div>
            ))}
            {errorStats.topErrorFields.length === 0 && (
              <p className="text-gray-500 text-center py-4">No missing fields found</p>
            )}
          </div>
        </motion.div>

        {/* Error Types Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Error Types Distribution</h3>
          <div className="space-y-3">
            {Object.entries(errorStats.errorTypes).map(([type, count], index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{type}</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${(Number(count) / errorStats.totalErrors) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{String(count)}</span>
                </div>
              </div>
            ))}
            {Object.keys(errorStats.errorTypes).length === 0 && (
              <p className="text-gray-500 text-center py-4">No errors detected</p>
            )}
          </div>
        </motion.div>

        {/* Failed Documents List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Failed Documents</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Filename</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Error Type</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {errorStats.failedDocuments.map((doc, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">{doc.filename}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        Processing Failed
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Retry
                      </button>
                    </td>
                  </tr>
                ))}
                {errorStats.failedDocuments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No failed documents
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommendations for Improvement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">🎯 Focus on Missing Fields</h4>
              <p className="text-sm text-gray-600">
                {errorStats.topErrorFields.length > 0 
                  ? `Prioritize extracting ${errorStats.topErrorFields[0]?.field} fields which are missing most frequently`
                  : 'All fields are being extracted successfully'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">⚡ Optimize Validation</h4>
              <p className="text-sm text-gray-600">
                {Object.keys(errorStats.errorTypes).includes('Total Mismatch')
                  ? 'Review line items extraction logic to improve total amount matching'
                  : 'Validation rules working correctly'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">🔄 Retry Failed Documents</h4>
              <p className="text-sm text-gray-600">
                {errorStats.failedDocuments.length > 0
                  ? `${errorStats.failedDocuments.length} documents failed. Consider checking PDF format or retrying`
                  : 'No failed documents to retry'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">📈 Monitor Trends</h4>
              <p className="text-sm text-gray-600">
                Track error patterns over time to identify systemic issues in invoice processing
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}