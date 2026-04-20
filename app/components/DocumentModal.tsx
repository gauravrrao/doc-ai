'use client';

import { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle, Edit2, Eye, DollarSign, Calendar, Building, Hash, Package, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface DocumentModalProps {
  document: any;
  onClose: () => void;
}

export default function DocumentModal({ document, onClose }: DocumentModalProps) {
  const [editedData, setEditedData] = useState(document.extractedData || {});
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData),
      });
      
      if (response.ok) {
        toast.success('Document updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      toast.error('Failed to update document');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Document Details
              </h2>
              <p className="text-sm text-gray-400 mt-1">{document.filename}</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Validation Status Card */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${
                document.validationLog?.isValid 
                  ? 'bg-gradient-to-r from-green-900/20 to-green-800/20 border-green-700/50' 
                  : 'bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-yellow-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  document.validationLog?.isValid ? 'bg-green-500/20' : 'bg-yellow-500/20'
                }`}>
                  {document.validationLog?.isValid ? (
                    <CheckCircle className="text-green-400" size={20} />
                  ) : (
                    <AlertCircle className="text-yellow-400" size={20} />
                  )}
                </div>
                <div>
                  <span className={`font-semibold ${
                    document.validationLog?.isValid ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {document.validationLog?.isValid ? '✓ Validation Passed' : '⚠️ Validation Issues Found'}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Confidence Score: {(document.confidenceScore * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              {document.validationLog?.warnings?.length > 0 && (
                <div className="mt-3 space-y-1">
                  {document.validationLog.warnings.map((warning: string, i: number) => (
                    <p key={i} className="text-sm text-yellow-400/90 flex items-center gap-2">
                      <span className="w-1 h-1 bg-yellow-400 rounded-full"></span>
                      {warning}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Extracted Data Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg">
                    <Eye size={16} className="text-blue-400" />
                  </div>
                  Extracted Information
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800"
                >
                  {isEditing ? (
                    <>Cancel</>
                  ) : (
                    <>
                      <Edit2 size={14} />
                      Edit
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vendor Name */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Building size={12} />
                    Vendor Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.vendorName || ''}
                      onChange={(e) => setEditedData({ ...editedData, vendorName: e.target.value })}
                      className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Enter vendor name"
                    />
                  ) : (
                    <p className="text-gray-200 font-medium">
                      {document.extractedData?.vendorName || 
                        <span className="text-gray-500 italic">Not extracted</span>
                      }
                    </p>
                  )}
                </div>

                {/* Invoice Number */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Hash size={12} />
                    Invoice Number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.invoiceNumber || ''}
                      onChange={(e) => setEditedData({ ...editedData, invoiceNumber: e.target.value })}
                      className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Enter invoice number"
                    />
                  ) : (
                    <p className="text-gray-200 font-medium">
                      {document.extractedData?.invoiceNumber || 
                        <span className="text-gray-500 italic">Not extracted</span>
                      }
                    </p>
                  )}
                </div>

                {/* Invoice Date */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Calendar size={12} />
                    Invoice Date
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedData.invoiceDate?.split('T')[0] || ''}
                      onChange={(e) => setEditedData({ ...editedData, invoiceDate: e.target.value })}
                      className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  ) : (
                    <p className="text-gray-200 font-medium">
                      {document.extractedData?.invoiceDate 
                        ? new Date(document.extractedData.invoiceDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : <span className="text-gray-500 italic">Not extracted</span>
                      }
                    </p>
                  )}
                </div>

                {/* Total Amount */}
                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-4 border border-blue-700/50">
                  <label className="text-xs font-medium text-blue-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                    <DollarSign size={12} />
                    Total Amount
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedData.totalAmount || ''}
                      onChange={(e) => setEditedData({ ...editedData, totalAmount: parseFloat(e.target.value) })}
                      className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Enter total amount"
                    />
                  ) : (
                    <p className="text-2xl font-bold text-blue-400">
                      {document.extractedData?.currency || '$'} {document.extractedData?.totalAmount?.toFixed(2) || '0.00'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items */}
            {document.extractedData?.lineItems && document.extractedData.lineItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg">
                    <Package size={16} className="text-purple-400" />
                  </div>
                  Line Items
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-700">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Description</th>
                        <th className="px-4 py-3 text-right text-gray-300 font-semibold">Quantity</th>
                        <th className="px-4 py-3 text-right text-gray-300 font-semibold">Unit Price</th>
                        <th className="px-4 py-3 text-right text-gray-300 font-semibold">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {document.extractedData.lineItems.map((item: any, i: number) => (
                        <motion.tr 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-300">{item.description}</td>
                          <td className="px-4 py-3 text-right text-gray-300">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-300">
                            {document.extractedData?.currency || '$'} {item.unitPrice?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-300 font-medium">
                            {document.extractedData?.currency || '$'} {item.lineTotal?.toFixed(2)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-800/50 border-t border-gray-700">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-200">
                          Total
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-blue-400">
                          {document.extractedData?.currency || '$'} {document.extractedData?.totalAmount?.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Missing Fields */}
            {document.validationLog?.missingFields?.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-red-500/20 rounded-lg">
                    <AlertCircle size={16} className="text-red-400" />
                  </div>
                  Missing Fields
                </h3>
                <div className="flex flex-wrap gap-2">
                  {document.validationLog.missingFields.map((field: string, i: number) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20"
                    >
                      {field}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Processing Info */}
            <div className="pt-4 border-t border-gray-700 flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>🕒 Processed: {new Date(document.createdAt).toLocaleString()}</span>
                <span>⚡ Time: {document.processingTime}ms</span>
                {document.promptVersion && <span>🤖 Version: {document.promptVersion}</span>}
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={12} />
                <span>Confidence: {(document.confidenceScore * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end gap-3 pt-4 border-t border-gray-700"
              >
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}