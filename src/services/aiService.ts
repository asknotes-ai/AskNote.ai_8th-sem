
/**
 * Service for interacting with local AI models and providing enhanced responses
 */

import { PageContent } from '@/types/pdf';
 
/**
 * Find external resources related to a topic
 * @param topic The topic to search for
 * @returns An object containing links to Google and YouTube
 */
export const findExternalResources = (topic: string): { google: string, youtube: string } => {
  const encodedTopic = encodeURIComponent(topic);
  return {
    google: `https://www.google.com/search?q=${encodedTopic}`,
    youtube: `https://www.youtube.com/results?search_query=${encodedTopic}`
  };
};

/**
 * Answers a question based on provided context using a local language model
 * @param context The context from the PDF to base the answer on
 * @param pages Page numbers where the information was found
 * @param question The user's question
 * @returns A promise that resolves to the model's answer
 */
export const generateAnswer = async (
  context: string,
  pages: number[],
  question: string
): Promise<string> => {
  try {
    if (!context || context.trim() === '') {
      return "I don't see any content to work with in the document yet. Could you try uploading a document first? I'd love to help answer your questions! 🤗";
    }

    // For now, use enhanced local answering as the default approach
    // This can be replaced with a locally hosted model like llama.cpp or similar
    const answer = enhancedLocalAnswering(context, pages, question);
    
    // Find external resources related to the question
    const { google, youtube } = findExternalResources(question);
    
    // Format the response with external resources
    const externalResourcesSection = `\n\n🔍 External resources for further study:\n- [Google Search](${google})\n- [YouTube Videos](${youtube})`;
    
    return answer + externalResourcesSection;
  } catch (error) {
    console.error("Error generating answer:", error);
    return enhancedLocalAnswering(context, pages, question);
  }
};

// Enhanced local answering function
const enhancedLocalAnswering = (context: string, pages: number[], question: string): string => {
  const questionType = identifyQuestionType(question);
  
  let response = "👋 Here's what I found in the document:\n\n";
  
  if (questionType === 'summary') {
    response = "📚 Here's a friendly summary:\n\n" + generateSummary(context);
  } else if (questionType === 'specific') {
    response = "🔍 I found this specific information:\n\n" + context;
  } else {
    response = "💡 Based on the document:\n\n" + context;
  }
  
  // Add page references if available
  if (pages.length > 0) {
    response += `\n\n📄 This information can be found on page${pages.length > 1 ? 's' : ''} ${pages.join(', ')}.`;
  }
  
  return response + "\n\n✨ Let me know if you'd like to know more!";
};

// Helper function to identify question type
const identifyQuestionType = (question: string): 'summary' | 'specific' | 'general' => {
  const questionLower = question.toLowerCase();
  if (questionLower.includes('summarize') || questionLower.includes('summary')) {
    return 'summary';
  }
  if (questionLower.includes('what') || questionLower.includes('when') || 
      questionLower.includes('where') || questionLower.includes('who') ||
      questionLower.includes('how') || questionLower.includes('why')) {
    return 'specific';
  }
  return 'general';
};

// Helper function to generate a friendly summary
const generateSummary = (context: string): string => {
  const paragraphs = context.split('\n\n').filter(p => p.trim().length > 0);
  
  if (paragraphs.length <= 1) {
    return context;
  }
  
  return `${paragraphs[0]}\n\n🔑 Key points:\n${
    paragraphs.slice(1).map(p => `• ${p.trim()}`).join('\n')
  }`;
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
 * Extract meaningful phrases from a question
 */
const extractPhrases = (question: string): string[] => {
  // Remove question words and common words at the beginning
  const cleanedQuestion = question
    .replace(/^(what|when|where|which|who|whom|whose|why|how|does|did|can|could|would|should|tell me about|explain|describe) /i, '')
    .replace(/[^\w\s]/g, '');
    
  // Extract 2-3 word phrases
  const words = cleanedQuestion.split(' ').filter(word => word.length > 2);
  const phrases = [];
  
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
    if (i < words.length - 2) {
      phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }
  
  return [...phrases, cleanedQuestion];
};
