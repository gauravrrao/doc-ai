'use client';

import { useState } from 'react';
import { Eye, RefreshCw, AlertTriangle, CheckCircle, Clock, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import DocumentModal from './DocumentModal';

interface Document {
  id: string;
  filename: string;
  status: string;
  processingTime: number;
  confidenceScore: number;
  createdAt: string;
  extractedData: any;
  validationLog: any;
}

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
}

export default function DocumentList({ documents, isLoading }: DocumentListProps) {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VALIDATED':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'EXTRACTED':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'FAILED':
        return <AlertTriangle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-blue-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALIDATED':
        return 'bg-green-100 text-green-800';
      case 'EXTRACTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      const response = await fetch(`/api/reprocess/${id}`, { method: 'POST' });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Reprocess failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <Clock className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-500">No documents processed yet</p>
        <p className="text-sm text-gray-400 mt-2">Upload your first invoice to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Filename</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Confidence</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Processing Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map((doc, index) => (
                <motion.tr
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{doc.filename}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(doc.status)}
                      <span className="text-sm font-medium">
                        {doc.confidenceScore ? `${(doc.confidenceScore * 100).toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {doc.processingTime ? `${doc.processingTime.toFixed(2)}s` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleReprocess(doc.id)}
                        className="p-1 text-green-600 hover:text-green-800 transition"
                        title="Reprocess"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDoc && (
        <DocumentModal document={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </>
  );
}