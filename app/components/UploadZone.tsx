"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import DocumentModal from "./DocumentModal";

interface UploadZoneProps {
  onUpload: (files: FileList) => void;
  refreshDocuments?: () => Promise<void>;
    onDocumentUploaded?: (document: any) => void;
}

export default function UploadZone({ onUpload }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedDocument, setUploadedDocument] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(
      (file) => file.type === "application/pdf",
    );
    if (pdfFiles.length === 0) {
      toast.error("Please upload PDF files only");
      return;
    }
    setSelectedFiles((prev) => [...prev, ...pdfFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchDocumentDetails = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const document = await response.json();
        setUploadedDocument(document);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error fetching document details:", error);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Try to get document from different possible response structures
        let uploadedDoc = null;

        if (result.document) {
          uploadedDoc = result.document;
        } else if (result.results && result.results.length > 0) {
          const successResult = result.results.find(
            (r: any) => r.status === "SUCCESS",
          );
          if (successResult && successResult.document) {
            uploadedDoc = successResult.document;
          } else if (successResult && successResult.id) {
            // If only ID is returned, fetch it
            const docResponse = await fetch(
              `/api/documents/${successResult.id}`,
            );
            if (docResponse.ok) {
              uploadedDoc = await docResponse.json();
            }
          }
        }

        if (uploadedDoc) {
          setUploadedDocument(uploadedDoc);
          setShowModal(true);
        }

        toast.success("Upload successful!");
        setSelectedFiles([]);
        onUpload(formData);
      } else {
        toast.error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error uploading files");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 bg-white/50 backdrop-blur-sm
            ${
              isDragActive
                ? "border-blue-500 bg-blue-50 scale-105"
                : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
            }
          `}
        >
          <input {...getInputProps()} />
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: isDragActive ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Upload
              className={`mx-auto mb-4 ${isDragActive ? "text-blue-500" : "text-gray-400"}`}
              size={48}
            />
            <p className="text-lg font-medium text-gray-700">
              {isDragActive
                ? "Drop your PDFs here"
                : "Drag & drop invoice PDFs here"}
            </p>
            <p className="text-sm text-gray-500 mt-2">or click to browse</p>
            <p className="text-xs text-gray-400 mt-4">
              Supports multiple PDF files (max 20 files)
            </p>
          </motion.div>
        </div>

        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="font-semibold text-gray-800 mb-4">
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <File size={20} className="text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`
                  flex-1 py-3 rounded-lg font-medium transition-all transform
                  ${
                    uploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 hover:shadow-lg text-white"
                  }
                `}
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Uploading...
                  </div>
                ) : (
                  `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? "s" : ""}`
                )}
              </button>
              <button
                onClick={() => setSelectedFiles([])}
                className="px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              >
                Clear All
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Document Modal */}
      {showModal && uploadedDocument && (
        <DocumentModal
          document={uploadedDocument}
          onClose={() => {
            setShowModal(false);
            setUploadedDocument(null);
          }}
        />
      )}
    </>
  );
}
