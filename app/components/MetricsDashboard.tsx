'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, CheckCircle, XCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricsDashboardProps {
  documents: any[];
}

export default function MetricsDashboard({ documents }: MetricsDashboardProps) {
  const [metrics, setMetrics] = useState<{
    totalProcessed: number;
    successRate: number;
    avgConfidence: number;
    avgProcessingTime: number;
    statusDistribution: Record<string, number>;
    processingTrends: Array<{ date: string; time: number; confidence: number }>;
    confidenceDistribution: Array<{ range: string; count: number }>;
  }>({
    totalProcessed: 0,
    successRate: 0,
    avgConfidence: 0,
    avgProcessingTime: 0,
    statusDistribution: {},
    processingTrends: [],
    confidenceDistribution: []
  });

  useEffect(() => {
    if (documents && documents.length > 0) {
      const total = documents.length;
      const validated = documents.filter(d => d.status === 'VALIDATED').length;
      const successRate = (validated / total) * 100;
      const avgConfidence = documents.reduce((sum, d) => sum + (d.confidenceScore || 0), 0) / total;
      const avgProcessingTime = documents.reduce((sum, d) => sum + (d.processingTime || 0), 0) / total;

      const statusDistribution = documents.reduce((acc: any, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
      }, {});

      const processingTrends = documents
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map(doc => ({
          date: new Date(doc.createdAt).toLocaleDateString(),
          time: doc.processingTime || 0,
          confidence: (doc.confidenceScore || 0) * 100
        }));

      const confidenceRanges = [
        { range: '0-50%', count: 0 },
        { range: '50-70%', count: 0 },
        { range: '70-90%', count: 0 },
        { range: '90-100%', count: 0 },
      ];

      documents.forEach(doc => {
        const confidence = (doc.confidenceScore || 0) * 100;
        if (confidence < 50) confidenceRanges[0].count++;
        else if (confidence < 70) confidenceRanges[1].count++;
        else if (confidence < 90) confidenceRanges[2].count++;
        else confidenceRanges[3].count++;
      });

      setMetrics({
        totalProcessed: total,
        successRate,
        avgConfidence: avgConfidence * 100,
        avgProcessingTime,
        statusDistribution,
        processingTrends,
        confidenceDistribution: confidenceRanges
      });
    }
  }, [documents]);

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];
  const statusColors: any = {
    VALIDATED: '#10B981',
    EXTRACTED: '#F59E0B',
    FAILED: '#EF4444',
    PROCESSING: '#3B82F6'
  };

  const statsCards = [
    {
      title: 'Total Processed',
      value: metrics.totalProcessed,
      icon: Activity,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Success Rate',
      value: `${metrics.successRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+5%'
    },
    {
      title: 'Avg Confidence',
      value: `${metrics.avgConfidence.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+3%'
    },
    {
      title: 'Avg Processing',
      value: `${metrics.avgProcessingTime.toFixed(2)}s`,
      icon: Zap,
      color: 'bg-orange-500',
      change: '-0.5s'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
                <p className="text-xs text-green-600 mt-2">{stat.change} from last week</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Time Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Processing Time Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.processingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" label={{ value: 'Time (s)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Confidence (%)', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="time" stroke="#3B82F6" name="Processing Time (s)" />
              <Line yAxisId="right" type="monotone" dataKey="confidence" stroke="#10B981" name="Confidence Score (%)" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(metrics.statusDistribution).map(([name, value]) => ({ name, value }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {Object.entries(metrics.statusDistribution).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry[0]] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Confidence Score Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Confidence Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.confidenceDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8">
                {metrics.confidenceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Performance Indicators</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Extraction Accuracy</span>
                <span className="text-sm font-medium">{metrics.successRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${metrics.successRate}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Average Confidence</span>
                <span className="text-sm font-medium">{metrics.avgConfidence.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${metrics.avgConfidence}%` }}></div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Documents</span>
                <span className="text-2xl font-bold text-gray-800">{metrics.totalProcessed}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Validated Documents</span>
                <span className="text-2xl font-bold text-green-600">
                  {Object.entries(metrics.statusDistribution).find(([key]) => key === 'VALIDATED')?.[1] || 0}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}