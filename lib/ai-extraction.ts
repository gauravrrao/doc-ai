// lib/ai-extraction.ts
import Groq from 'groq-sdk';
import { parsePDF } from './pdf-parser';

// Initialize Groq client
let groq: Groq | null = null;

try {
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in environment variables');
  } else {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    console.log('Groq client initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Groq client:', error);
}

// Updated prompt versions with current models
const PROMPT_VERSIONS = {
  'v1.0': {
    system: `You are an expert invoice data extraction system. Extract structured data from invoice text.
    
    Extract the following fields:
    - vendor_name: Company name that issued the invoice
    - invoice_number: Invoice ID or number
    - invoice_date: Date in YYYY-MM-DD format
    - currency: Currency code (USD, EUR, GBP, etc.)
    - total_amount: Total amount as a number
    - tax_amount: Tax amount as a number (if found)
    - line_items: Array of items with description, quantity, unit_price, line_total
    
    Return ONLY valid JSON.`,
    temperature: 0.1,
    max_tokens: 2000,
    model: 'llama-3.3-70b-versatile', // Updated to current model
  },
  'v1.1': {
    system: `You are an expert invoice data extraction system. Extract structured data from invoice text.
    
    Extract the following fields:
    - vendor_name: Company name that issued the invoice
    - invoice_number: Invoice ID or number
    - invoice_date: Date in YYYY-MM-DD format
    - currency: Currency code (USD, EUR, GBP, etc.)
    - total_amount: Total amount as a number
    - tax_amount: Tax amount as a number (if found)
    - line_items: Array of items with description, quantity, unit_price, line_total
    
    Return ONLY valid JSON.`,
    temperature: 0.1,
    max_tokens: 2000,
    model: 'llama-3.1-8b-instant', // Faster, cheaper option
  },
  'v2.0': {
    system: `You are an expert invoice data extraction system. Extract structured data from invoice text.
    
    Extract the following fields:
    - vendor_name: Company name that issued the invoice
    - invoice_number: Invoice ID or number
    - invoice_date: Date in YYYY-MM-DD format
    - currency: Currency code (USD, EUR, GBP, etc.)
    - total_amount: Total amount as a number
    - tax_amount: Tax amount as a number (if found)
    - line_items: Array of items with description, quantity, unit_price, line_total
    
    Return ONLY valid JSON.`,
    temperature: 0.1,
    max_tokens: 2000,
    model: 'gemma2-9b-it', // Alternative model
  },
};

// Available Groq models as of 2026
const AVAILABLE_MODELS = [
  'llama-3.3-70b-versatile',  // Most capable
  'llama-3.1-8b-instant',     // Fast and efficient
  'gemma2-9b-it',             // Google's model
  'mixtral-8x7b-32768',       // Deprecated - don't use
];

export async function extractInvoiceData(
  pdfBuffer: Buffer,
  promptVersion: string = 'v1.0'
) {
  console.log('=== Starting AI Extraction ===');
  
  if (!groq) {
    console.error('Groq client not initialized. Check GROQ_API_KEY');
    return {
      success: false,
      error: 'Groq client not initialized. Please check your GROQ_API_KEY in .env.local',
    };
  }
  
  const startTime = Date.now();
  
  try {
    // Step 1: Parse PDF
    console.log('Step 1: Parsing PDF to text...');
    const pdfText = await parsePDF(pdfBuffer);
    console.log(`Step 1 Complete: Extracted ${pdfText.length} characters`);
    console.log(`First 500 chars: ${pdfText.substring(0, 500)}`);
    
    if (!pdfText || pdfText.length < 50) {
      throw new Error('PDF text extraction failed - text too short');
    }
    
    // Step 2: Prepare prompt
    const promptConfig = PROMPT_VERSIONS[promptVersion] || PROMPT_VERSIONS['v1.0'];
    
    const userPrompt = `Extract invoice data from this text:
    
${pdfText.substring(0, 4000)}

Return JSON in this exact format:
{
  "vendor_name": {"value": "string or null", "confidence": 0.9},
  "invoice_number": {"value": "string or null", "confidence": 0.9},
  "invoice_date": {"value": "YYYY-MM-DD or null", "confidence": 0.9},
  "currency": {"value": "string or null", "confidence": 0.9},
  "total_amount": {"value": number or null, "confidence": 0.9},
  "tax_amount": {"value": number or null, "confidence": 0.9},
  "line_items": [],
  "overall_confidence": 0.9
}

If a field cannot be found, set value to null and confidence to 0.`;
    
    console.log(`Step 2: Calling Groq API with model: ${promptConfig.model}`);
    
    // Step 3: Call Groq API with updated model
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: promptConfig.system,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      model: promptConfig.model,
      temperature: promptConfig.temperature,
      max_tokens: promptConfig.max_tokens,
    });
    
    console.log('Step 3: Groq API response received');
    
    const responseContent = completion.choices[0]?.message?.content || '';
    console.log(`Response preview: ${responseContent.substring(0, 200)}`);
    
    // Step 4: Parse JSON response
    let extractedData;
    try {
      // Clean the response
      let cleanResponse = responseContent.trim();
      
      // Remove markdown code blocks
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/```\n?$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/```\n?$/, '');
      }
      
      // Try to find JSON object if there's extra text
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }
      
      extractedData = JSON.parse(cleanResponse);
      console.log('Step 4: JSON parsed successfully');
      
      // Validate required structure
      if (!extractedData.vendor_name) {
        extractedData.vendor_name = { value: null, confidence: 0 };
      }
      if (!extractedData.invoice_number) {
        extractedData.invoice_number = { value: null, confidence: 0 };
      }
      if (!extractedData.line_items) {
        extractedData.line_items = [];
      }
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', responseContent);
      
      // Create basic extracted data from raw text as fallback
      extractedData = createFallbackExtractedData(pdfText);
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`=== Extraction completed in ${processingTime}ms ===`);
    
    return {
      success: true,
      data: extractedData,
      promptVersion,
      model: promptConfig.model,
      processingTime,
    };
    
  } catch (error: any) {
    console.error('AI extraction failed:', error);
    return {
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    };
  }
}

// Helper function to create fallback extracted data from raw text
function createFallbackExtractedData(pdfText: string) {
  console.log('Creating fallback extracted data from raw text...');
  
  // Try to extract basic info using regex
  const invoiceNumberMatch = pdfText.match(/Invoice(?:\s*(?:ID|Number|#)?\s*[:.]?\s*([A-Z0-9-]+))/i);
  const dateMatch = pdfText.match(/(?:Date|Billing Date|Invoice Date)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  const amountMatch = pdfText.match(/Total(?:\s*Amount)?[\s:]*([A-Z]{3})?\s*([\d,]+\.?\d*)/i);
  const vendorMatch = pdfText.match(/^([A-Za-z\s]+(?:Pvt|LLC|Inc|Ltd|Corp|Company))/i);
  
  let totalAmount = null;
  let currency = null;
  
  if (amountMatch) {
    currency = amountMatch[1] || 'USD';
    totalAmount = parseFloat(amountMatch[2].replace(/,/g, ''));
  }
  
  let invoiceDate = null;
  if (dateMatch) {
    const dateStr = dateMatch[1];
    // Convert to YYYY-MM-DD
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      let year = parts[2];
      let month = parts[1];
      let day = parts[0];
      
      if (year.length === 2) year = '20' + year;
      invoiceDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return {
    vendor_name: { value: vendorMatch ? vendorMatch[1].trim() : null, confidence: 0.6 },
    invoice_number: { value: invoiceNumberMatch ? invoiceNumberMatch[1] : null, confidence: 0.7 },
    invoice_date: { value: invoiceDate, confidence: 0.6 },
    currency: { value: currency, confidence: 0.8 },
    total_amount: { value: totalAmount, confidence: 0.8 },
    tax_amount: { value: null, confidence: 0 },
    line_items: [],
    overall_confidence: 0.5
  };
}

// Test function to verify Groq is working with new model
export async function testGroqConnection() {
  console.log('Testing Groq API connection with llama-3.3-70b-versatile...');
  
  if (!groq) {
    return {
      success: false,
      error: 'Groq client not initialized. Check your GROQ_API_KEY',
    };
  }
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a test system.',
        },
        {
          role: 'user',
          content: 'Say "Groq is working!" in JSON format: {"status": "working"}',
        },
      ],
      model: 'llama-3.3-70b-versatile', // Updated model
      temperature: 0,
      max_tokens: 50,
    });
    
    console.log('Groq API test successful:', completion.choices[0]?.message?.content);
    
    return {
      success: true,
      message: 'Groq API connection successful',
      response: completion.choices[0]?.message?.content,
    };
  } catch (error: any) {
    console.error('Groq API test failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}