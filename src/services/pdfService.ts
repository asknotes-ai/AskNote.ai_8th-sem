
import * as pdfjsLib from 'pdfjs-dist';

// Set the PDF.js worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Interface for text content with page information
interface PageContent {
  text: string;
  pageNum: number;
}

/**
 * Extracts text from a PDF file with page tracking
 * @param file The PDF file to extract text from
 * @returns A promise that resolves to the extracted text and page mapping
 */
export const extractTextFromPDF = async (file: File): Promise<{ fullText: string, pageContents: PageContent[] }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: typedArray });
    const pdf = await loadingTask.promise;
    
    // Extract text from each page
    let fullText = '';
    const pageContents: PageContent[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map(item => 'str' in item ? item.str : '');
      const pageText = textItems.join(' ');
      
      // Store page content with page number
      pageContents.push({
        text: pageText,
        pageNum: pageNum
      });
      
      fullText += pageText + '\n\n';
    }
    
    return { fullText: fullText.trim(), pageContents };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Find relevant context from PDF text based on user's question
 * @param pdfText The full PDF text
 * @param pageContents The page content mapping
 * @param question The user's question
 * @returns Relevant context from the PDF with page references
 */
export const findRelevantContext = (
  pdfText: string, 
  pageContents: PageContent[], 
  question: string
): { context: string, pages: number[] } => {
  if (!pdfText || pdfText.trim() === '') {
    return { context: '', pages: [] };
  }
  
  // Normalize the question/search term
  const searchTerm = question.toLowerCase().trim();
  
  // Split text into paragraphs
  const paragraphs = pdfText.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // Find paragraphs that contain the exact topic
  const exactMatches = paragraphs.filter(paragraph => {
    const paragraphLower = paragraph.toLowerCase();
    // Look for topic definitions (e.g., "Bots:", "1. Bots", "• Bots")
    const topicPattern = new RegExp(`(^|\\n|\\d+\\.|•|\\*)\\s*${searchTerm}\\b[:\\s]`, 'i');
    return topicPattern.test(paragraph);
  });

  let relevantParagraphs: string[] = [];
  if (exactMatches.length > 0) {
    relevantParagraphs = exactMatches;
  } else {
    // If no exact topic match, find paragraphs containing the term
    const relatedMatches = paragraphs.filter(paragraph => {
      const paragraphLower = paragraph.toLowerCase();
      return paragraphLower.includes(searchTerm);
    });
    
    if (relatedMatches.length > 0) {
      relevantParagraphs = relatedMatches;
    }
  }
  
  // If no relevant paragraphs, return message
  if (relevantParagraphs.length === 0) {
    return { 
      context: `No specific information found about "${searchTerm}" in the document.`,
      pages: [] 
    };
  }
  
  // Find page numbers for each matched paragraph
  const matchedPages: number[] = [];
  for (const paragraph of relevantParagraphs) {
    for (const pageContent of pageContents) {
      if (pageContent.text.includes(paragraph.substring(0, 100))) { // Using substring for partial matching
        if (!matchedPages.includes(pageContent.pageNum)) {
          matchedPages.push(pageContent.pageNum);
        }
        break;
      }
    }
  }
  
  return {
    context: relevantParagraphs.join('\n\n'),
    pages: matchedPages.sort((a, b) => a - b)
  };
};

/**
 * Extract meaningful keywords from a question
 */
const extractKeywords = (question: string): string[] => {
  // Remove question words and common stopwords
  const stopwords = ['what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 
                     'does', 'did', 'do', 'is', 'are', 'was', 'were', 'am', 'be', 'being', 'been',
                     'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
                     'about', 'with', 'for', 'to', 'from', 'in', 'on', 'at', 'by', 'and', 'or',
                     'the', 'a', 'an', 'this', 'that', 'these', 'those', 'tell', 'explain', 'describe',
                     'provide', 'give', 'me', 'please', 'information', 'details', 'regarding'];
  
  // Clean up the question and split into words
  const words = question
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 2) // Only words with 3+ characters
    .filter(word => !stopwords.includes(word))
    .map(word => word.toLowerCase());
  
  // Extract 2-3 word phrases that might be important
  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (!stopwords.includes(words[i]) && !stopwords.includes(words[i+1])) {
      phrases.push(`${words[i]} ${words[i+1]}`);
    }
    
    if (i < words.length - 2 && !stopwords.includes(words[i]) && 
        !stopwords.includes(words[i+1]) && !stopwords.includes(words[i+2])) {
      phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
    }
  }
  
  return [...new Set([...words, ...phrases])]; // Remove duplicates
};

/**
 * Simple function to answer questions about the PDF content
 * @param pdfText The full PDF text
 * @param pageContents The page content mapping
 * @param question The user's question
 * @returns An answer to the question based on the PDF content
 */
export const answerQuestion = async (
  pdfText: string, 
  pageContents: PageContent[], 
  question: string
): Promise<string> => {
  try {
    if (!pdfText || pdfText.trim() === '') {
      return "I don't see any text in the PDF. Please upload a valid PDF with text content.";
    }
    
    // Find relevant context
    const { context, pages } = findRelevantContext(pdfText, pageContents, question);
    
    if (!context || context.trim() === '') {
      return "I couldn't find information related to your question in the PDF. Could you try asking something else?";
    }
    
    // Simple answer generation (normally would use a language model here)
    const pagesInfo = pages.length > 0 
      ? `\n\nThis information can be found on page${pages.length > 1 ? 's' : ''} ${pages.join(', ')}.` 
      : '';
    
    return `Based on the PDF content: ${context}${pagesInfo}`;
  } catch (error) {
    console.error('Error answering question:', error);
    return "I encountered an error while processing your question. Please try again.";
  }
};
