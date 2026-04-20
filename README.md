# 🤖 AI Document Intelligence System

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0.0-blue)](https://prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38B2AC)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-AI-FF6B6B)](https://groq.com/)

An enterprise-grade AI-powered document intelligence system that automatically extracts, validates, and manages invoice data with high accuracy. Built with Next.js 16, Prisma 6, and Groq AI.

## ✨ Features

### 📄 Intelligent Document Processing
- **Multi-format Support**: Process invoices in various layouts and formats
- **AI-Powered Extraction**: Uses Groq's LLM to extract structured data from unstructured PDFs
- **Smart Field Mapping**: Automatically identifies fields regardless of naming variations (Invoice No, Bill ID, Inv #, etc.)
- **Line Item Extraction**: Handles complex multi-line item invoices with tables

### 🔍 Validation & Quality Assurance
- **Automatic Validation**: Validates extracted data against business rules
- **Sum Validation**: Checks if line items sum matches total amount
- **Confidence Scoring**: Returns confidence scores for each extracted field
- **Missing Field Detection**: Identifies and reports missing required fields

### 🎨 Modern User Interface
- **Drag & Drop Upload**: Bulk upload multiple invoices at once
- **Real-time Processing**: Live status updates during document processing
- **Interactive Dashboards**: Visual metrics and analytics
- **Manual Correction**: Edit extracted fields when needed
- **Error Report Dashboard**: Comprehensive error tracking and analysis

### 📊 Monitoring & Analytics
- **Processing Time Tracking**: Monitor extraction performance
- **Success Rate Metrics**: Track extraction accuracy over time
- **Confidence Distribution**: Visualize extraction confidence levels
- **Error Pattern Analysis**: Identify common extraction issues

### 🔄 Advanced Capabilities
- **Prompt Versioning**: Manage and version AI prompts
- **Reprocessing**: Retry failed extractions with different settings
- **Bulk Processing**: Handle multiple documents simultaneously
- **Database Storage**: Persistent storage with PostgreSQL and Prisma

## 🏗️ Architecture
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Next.js) │
│ - React Components with Tailwind CSS │
│ - Real-time uploads with drag-drop │
│ - Interactive dashboards with Recharts │
└─────────────────┬───────────────────────────────────────────┘
│ HTTP/REST API
┌─────────────────▼───────────────────────────────────────────┐
│ API Routes (Next.js) │
│ - /api/documents - Upload & retrieval │
│ - /api/reprocess - Retry extraction │
└─────────┬──────────────────┬────────────────────────────────┘
│ │
┌─────▼─────┐ ┌─────▼──────┐
│ Prisma │ │ Groq AI │
│ ORM │ │ Pipeline │
└─────┬─────┘ └─────┬──────┘
│ │
┌─────▼─────┐ ┌─────▼──────┐
│PostgreSQL │ │ LLM │




## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Groq API Key (free tier available)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-document-intelligence.git
cd ai-document-intelligence

2. Install dependencies

npm install

3. Set up environment variables

Edit .env with your credentials:

4. env
DATABASE_URL="postgresql://postgres:password@localhost:5432/doc_intelligence"
GROQ_API_KEY="your-groq-api-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

5.Set up database

bash
# Start PostgreSQL
sudo service postgresql start  # Linux
# or
brew services start postgresql  # macOS

# Create database
createdb doc_intelligence

# Run Prisma migrations
npx prisma generate
npx prisma db push

