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
