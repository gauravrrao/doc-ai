// lib/pdf-parser.js
import PDFParser from 'pdf2json';

export async function parsePDF(buffer) {
  return new Promise((resolve, reject) => {
    try {
      console.log("Parsing PDF with pdf2json...");
      
      const pdfParser = new PDFParser();
      
      pdfParser.on("pdfParser_dataError", (errData) => {
        console.error("PDF parsing error:", errData);
        reject(new Error(`PDF parsing failed: ${errData.parserError}`));
      });
      
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        // Extract text from the parsed data
        let fullText = '';
        
        if (pdfData.Pages) {
          for (const page of pdfData.Pages) {
            if (page.Texts) {
              for (const text of page.Texts) {
                if (text.R) {
                  for (const line of text.R) {
                    if (line.T) {
                      fullText += decodeURIComponent(line.T) + ' ';
                    }
                  }
                }
              }
              fullText += '\n';
            }
          }
        }
        
        console.log(`Extracted ${fullText.length} characters`);
        
        if (fullText.length === 0) {
          reject(new Error('No text extracted from PDF'));
        } else {
          resolve(fullText.trim());
        }
      });
      
      pdfParser.parseBuffer(buffer);
      
    } catch (error) {
      console.error("PDF parsing failed:", error);
      reject(error);
    }
  });
}