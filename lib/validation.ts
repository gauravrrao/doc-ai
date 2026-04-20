import { format, isValid, parse } from 'date-fns';

export interface ValidationResult {
  isValid: boolean;
  totalMatches: boolean;
  lineItemsSum: number;
  totalAmount: number;
  difference: number;
  missingFields: string[];
  validationErrors: Record<string, string>;
  warnings: string[];
}

export function validateExtractedData(
  extractedData: any,
  originalText?: string
): ValidationResult {
  const missingFields: string[] = [];
  const validationErrors: Record<string, string> = {};
  const warnings: string[] = [];
  
  // Check required fields
  const requiredFields = ['vendor_name', 'invoice_number', 'invoice_date', 'total_amount'];
  for (const field of requiredFields) {
    if (!extractedData[field]?.value) {
      missingFields.push(field);
    }
  }
  
  // Validate date format
  if (extractedData.invoice_date?.value) {
    const date = parse(extractedData.invoice_date.value, 'yyyy-MM-dd', new Date());
    if (!isValid(date)) {
      validationErrors.invoice_date = 'Invalid date format';
    }
  }
  
  // Calculate line items sum
  let lineItemsSum = 0;
  if (extractedData.line_items && Array.isArray(extractedData.line_items)) {
    lineItemsSum = extractedData.line_items.reduce(
      (sum: number, item: any) => sum + (item.line_total || 0),
      0
    );
    
    // Check if line items sum matches total amount
    const totalAmount = extractedData.total_amount?.value || 0;
    const difference = Math.abs(lineItemsSum - totalAmount);
    const totalMatches = difference < 0.01; // Allow 1 cent difference
    
    if (!totalMatches) {
      warnings.push(
        `Line items sum (${lineItemsSum}) doesn't match total amount (${totalAmount}), difference: ${difference}`
      );
    }
    
    return {
      isValid: missingFields.length === 0 && Object.keys(validationErrors).length === 0,
      totalMatches,
      lineItemsSum,
      totalAmount,
      difference,
      missingFields,
      validationErrors,
      warnings,
    };
  }
  
  return {
    isValid: false,
    totalMatches: false,
    lineItemsSum: 0,
    totalAmount: extractedData.total_amount?.value || 0,
    difference: 0,
    missingFields,
    validationErrors,
    warnings,
  };
}

export function normalizeExtractedData(rawData: any): any {
  return {
    vendorName: rawData.vendor_name?.value || rawData.vendor_name,
    invoiceNumber: rawData.invoice_number?.value || rawData.invoice_number,
    invoiceDate: rawData.invoice_date?.value ? 
      format(new Date(rawData.invoice_date.value), 'yyyy-MM-dd') : null,
    currency: rawData.currency?.value || rawData.currency || 'USD',
    totalAmount: parseFloat(rawData.total_amount?.value || rawData.total_amount || 0),
    taxAmount: parseFloat(rawData.tax_amount?.value || rawData.tax_amount || 0),
    lineItems: (rawData.line_items || []).map((item: any) => ({
      description: item.description,
      quantity: parseFloat(item.quantity),
      unitPrice: parseFloat(item.unit_price),
      lineTotal: parseFloat(item.line_total),
    })),
    confidenceScore: rawData.overall_confidence || 0.5,
  };
}