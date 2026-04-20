'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Activity, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import UploadZone from './components/UploadZone';
import DocumentList from './components/DocumentList';
import MetricsDashboard from './components/MetricsDashboard';
import ErrorReportDashboard from './components/ErrorReportDashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');
  const queryClient = useQueryClient();
  
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => fetch('/api/documents').then(res => res.json()),
  });
  
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('files', file));
      const res = await fetch('/api/documents', { method: 'post', body: formData });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documents uploaded successfully');
    },
    onError: () => toast.error('Upload failed'),
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 text-center"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI Document Intelligence
          </h1>
          <p className="text-gray-600 mt-2">Intelligent Invoice Processing with AI</p>
        </motion.div>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-8 justify-center">
          {['upload', 'documents', 'metrics', 'errors'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:shadow-md'
              }`}
            >
              {tab === 'upload' && <Upload className="inline mr-2" size={18} />}
              {tab === 'documents' && <FileText className="inline mr-2" size={18} />}
              {tab === 'metrics' && <Activity className="inline mr-2" size={18} />}
              {tab === 'errors' && <AlertCircle className="inline mr-2" size={18} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'upload' && <UploadZone onUpload={uploadMutation.mutate} />}
            {activeTab === 'documents' && <DocumentList documents={documents} isLoading={isLoading} />}
            {activeTab === 'metrics' && <MetricsDashboard documents={documents} />}
            {activeTab === 'errors' && <ErrorReportDashboard documents={documents} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}