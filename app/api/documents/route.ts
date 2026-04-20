import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import cloudinary from "../../../lib/cloudinary";
import { extractInvoiceData } from "../../../lib/ai-extraction";
import {
  normalizeExtractedData,
  validateExtractedData,
} from "../../../lib/validation";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");
    const promptVersion =
      (formData.get("promptVersion") as string) || "v1.0";

    if (!files.length) {
      return NextResponse.json(
        { error: "No files uploaded" },
        { status: 400 }
      );
    }

    const results = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const startTime = Date.now();

      try {
        // ✅ Convert file → Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (!buffer.length) throw new Error("Empty file");

        // =========================
        // ✅ AI Extraction FIRST
        // =========================
        const extractionResult = await extractInvoiceData(
          buffer,
          promptVersion
        );

        if (!extractionResult.success) {
          throw new Error(extractionResult.error);
        }

        const normalizedData = normalizeExtractedData(
          extractionResult.data
        );

        const validationResult = validateExtractedData(
          extractionResult.data
        );

        // =========================
        // ✅ Upload AFTER processing
        // =========================
        const cloudinaryResult =
          await cloudinary.uploader.upload(
            `data:application/pdf;base64,${buffer.toString("base64")}`,
            {
              folder: "invoices",
              resource_type: "raw",
              public_id: `${Date.now()}-${file.name.replace(
                /\.[^/.]+$/,
                ""
              )}`,
            }
          );

        // =========================
        // ✅ Save Document
        // =========================
        const document = await prisma.document.create({
          data: {
            filename: file.name,
            originalPath: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id,
            status: validationResult.isValid
              ? "VALIDATED"
              : "EXTRACTED",
            processingTime: Date.now() - startTime,
            confidenceScore:
              normalizedData.confidenceScore,
          },
        });

        // =========================
        // Save Extracted Data
        // =========================
        await prisma.extractedData.create({
          data: {
            documentId: document.id,
            vendorName: normalizedData.vendorName,
            invoiceNumber: normalizedData.invoiceNumber,
            invoiceDate: normalizedData.invoiceDate
              ? new Date(normalizedData.invoiceDate)
              : null,
            currency: normalizedData.currency,
            totalAmount: normalizedData.totalAmount,
            taxAmount: normalizedData.taxAmount,
            lineItems: normalizedData.lineItems,
            rawResponse: extractionResult.data,
            promptVersion:
              extractionResult.promptVersion,
          },
        });

        await prisma.validationLog.create({
          data: {
            documentId: document.id,
            ...validationResult,
          },
        });

       // In the POST method, after creating the document
results.push({
  id: document.id,
  filename: file.name,
  status: "SUCCESS",
  cloudinaryUrl: cloudinaryResult.secure_url,
  processingTime: Date.now() - startTime,
  document: {  // Add the full document data
    id: document.id,
    filename: document.filename,
    extractedData: {
      vendorName: normalizedData.vendorName,
      invoiceNumber: normalizedData.invoiceNumber,
      invoiceDate: normalizedData.invoiceDate,
      currency: normalizedData.currency,
      totalAmount: normalizedData.totalAmount,
      taxAmount: normalizedData.taxAmount,
      lineItems: normalizedData.lineItems,
    },
    validationLog: validationResult,
    confidenceScore: normalizedData.confidenceScore,
    processingTime: Date.now() - startTime,
    createdAt: document.createdAt,
  }
});
      } catch (error: any) {
        console.error("Processing error:", error);

        results.push({
          filename: file.name,
          status: "FAILED",
          error: error.message,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("API error:", error);

    return NextResponse.json(
      { error: "Failed to process documents" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const documents = await prisma.document.findMany({
    include: {
      extractedData: true,
      validationLog: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}