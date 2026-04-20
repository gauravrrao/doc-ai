import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { extractInvoiceData } from '../../../../lib/ai-extraction';
import { normalizeExtractedData, validateExtractedData } from '../../../../lib/validation';
import { readFile } from 'fs/promises';

// ✅ FIXED: params is now async, must be awaited
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Unwrap params with await (this is the key fix)
    const { id } = await params;
    
    console.log(`Reprocessing document: ${id}`);
    
    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    // Check if document exists
    const document = await prisma.document.findUnique({
      where: { id: id },  // ✅ Use the unwrapped id
      include: {
        extractedData: true,
        validationLog: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update status to reprocessing
    await prisma.document.update({
      where: { id: document.id },
      data: { status: 'REPROCESSING' },
    });

    // Read the original PDF
    console.log(`Reading PDF from: ${document.originalPath}`);
    const pdfBuffer = await readFile(document.originalPath);
    
    // Reprocess with AI
    console.log('Calling AI extraction...');
    const extractionResult = await extractInvoiceData(pdfBuffer);
    
    if (!extractionResult.success) {
      throw new Error(extractionResult.error || 'AI extraction failed');
    }
    
    console.log('AI extraction successful, normalizing data...');
    
    // Normalize and validate
    const normalizedData = normalizeExtractedData(extractionResult.data);
    const validationResult = validateExtractedData(extractionResult.data);
    
    // Update or create extracted data
    if (document.extractedData) {
      await prisma.extractedData.update({
        where: { documentId: document.id },
        data: {
          vendorName: normalizedData.vendorName,
          invoiceNumber: normalizedData.invoiceNumber,
          invoiceDate: normalizedData.invoiceDate ? new Date(normalizedData.invoiceDate) : null,
          currency: normalizedData.currency,
          totalAmount: normalizedData.totalAmount,
          taxAmount: normalizedData.taxAmount,
          lineItems: normalizedData.lineItems || [],
          rawResponse: extractionResult.data,
          promptVersion: extractionResult.promptVersion,
        },
      });
    } else {
      await prisma.extractedData.create({
        data: {
          documentId: document.id,
          vendorName: normalizedData.vendorName,
          invoiceNumber: normalizedData.invoiceNumber,
          invoiceDate: normalizedData.invoiceDate ? new Date(normalizedData.invoiceDate) : null,
          currency: normalizedData.currency,
          totalAmount: normalizedData.totalAmount,
          taxAmount: normalizedData.taxAmount,
          lineItems: normalizedData.lineItems || [],
          rawResponse: extractionResult.data,
          promptVersion: extractionResult.promptVersion,
        },
      });
    }
    
    // Update or create validation log
    if (document.validationLog) {
      await prisma.validationLog.update({
        where: { documentId: document.id },
        data: {
          isValid: validationResult.isValid,
          totalMatches: validationResult.totalMatches,
          lineItemsSum: validationResult.lineItemsSum,
          totalAmount: validationResult.totalAmount,
          difference: validationResult.difference,
          missingFields: validationResult.missingFields,
          validationErrors: validationResult.validationErrors,
          warnings: validationResult.warnings,
        },
      });
    } else {
      await prisma.validationLog.create({
        data: {
          documentId: document.id,
          isValid: validationResult.isValid,
          totalMatches: validationResult.totalMatches,
          lineItemsSum: validationResult.lineItemsSum,
          totalAmount: validationResult.totalAmount,
          difference: validationResult.difference,
          missingFields: validationResult.missingFields,
          validationErrors: validationResult.validationErrors,
          warnings: validationResult.warnings,
        },
      });
    }
    
    // Update document status
    await prisma.document.update({
      where: { id: document.id },
      data: {
        status: validationResult.isValid ? 'VALIDATED' : 'EXTRACTED',
        confidenceScore: normalizedData.confidenceScore,
      },
    });
    
    // Log the reprocessing
    await prisma.processingLog.create({
      data: {
        documentId: document.id,
        stage: 'REPROCESS',
        status: 'SUCCESS',
        message: 'Document reprocessed successfully',
        metadata: {
          previousStatus: document.status,
          newStatus: validationResult.isValid ? 'VALIDATED' : 'EXTRACTED',
          confidenceScore: normalizedData.confidenceScore,
        },
      },
    });
    
    console.log('Reprocessing completed successfully');
    
    return NextResponse.json({ 
      success: true,
      message: 'Document reprocessed successfully',
      document: {
        id: document.id,
        status: validationResult.isValid ? 'VALIDATED' : 'EXTRACTED',
        confidenceScore: normalizedData.confidenceScore,
        isValid: validationResult.isValid,
      }
    });
    
  } catch (error) {
    console.error('Reprocessing error:', error);
    
    // ✅ FIXED: Need to await params again in catch block
    let documentId = null;
    try {
      const { id } = await params;
      documentId = id;
    } catch (paramError) {
      console.error('Could not extract params in catch block');
    }
    
    // Type-guard error to safely access message and stack properties
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log the error if we have documentId
    if (documentId) {
      try {
        await prisma.processingLog.create({
          data: {
            documentId: documentId,
            stage: 'REPROCESS',
            status: 'FAILED',
            message: errorMessage,
            metadata: { error: errorStack },
          },
        });
        
        // Update document status to failed
        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'FAILED' },
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to reprocess document',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}