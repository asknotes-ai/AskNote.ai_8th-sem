
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { generateAnswer } from '@/services/aiService';
import { findRelevantContext, extractTextFromPDF } from '@/services/pdfService';
import { useToast } from '@/hooks/use-toast';
import ChatInterface from '@/components/ChatInterface';
import ChatSessionManager, { ChatSession, ChatMessage } from '@/components/ChatSessionManager';
import { v4 as uuidv4 } from 'uuid';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Session states
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Documents state - map session ID to its document content
  const [sessionDocuments, setSessionDocuments] = useState<Record<string, {text: string, name: string}>>({});

  // Get active session
  const activeSession = sessions.find(session => session.id === activeSessionId) || null;
  
  // Get active document text
  const activePdfText = activeSessionId ? sessionDocuments[activeSessionId]?.text || '' : '';
  
  // Initialize with welcome message when component mounts
  useEffect(() => {
    const loadSessions = () => {
      // Load sessions from localStorage if available
      const savedSessions = localStorage.getItem('chatSessions');
      if (savedSessions) {
        try {
          const parsedSessions = JSON.parse(savedSessions) as ChatSession[];
          
          // Convert string dates back to Date objects
          const sessionsWithDates = parsedSessions.map(session => ({
            ...session,
            createdAt: new Date(session.createdAt),
            messages: session.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          
          setSessions(sessionsWithDates);
          
          // Load documents if available
          const savedDocuments = localStorage.getItem('sessionDocuments');
          if (savedDocuments) {
            setSessionDocuments(JSON.parse(savedDocuments));
          }
          
          // Set active session to most recent if available
          if (sessionsWithDates.length > 0) {
            const mostRecent = sessionsWithDates.sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            )[0];
            setActiveSessionId(mostRecent.id);
          }
        } catch (e) {
          console.error("Error loading saved sessions:", e);
          // If error in parsing, start fresh
        }
      }
    };
    
    loadSessions();
  }, []);
  
  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('chatSessions', JSON.stringify(sessions));
    }
  }, [sessions]);
  
  // Save documents to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(sessionDocuments).length > 0) {
      localStorage.setItem('sessionDocuments', JSON.stringify(sessionDocuments));
    }
  }, [sessionDocuments]);

  // Create a new chat session
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      name: 'New Chat',
      messages: [{
        id: uuidv4(),
        text: '👋 Hello! I am AskNoteBot. I can help you understand your document better. What would you like to know?',
        sender: 'bot',
        timestamp: new Date()
      }],
      createdAt: new Date()
    };
    
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  // Handle file upload
  const handleFileUpload = async (file: File, sessionId?: string) => {
    setIsLoading(true);
    
    try {
      // Extract text from PDF
      const result = await extractTextFromPDF(file);
      
      // Determine which session to use
      let targetSessionId = sessionId;
      
      if (!targetSessionId) {
        // Create new session if uploading to main uploader
        const newSessionId = uuidv4();
        const newSession: ChatSession = {
          id: newSessionId,
          name: file.name.split('.')[0] || 'New Chat',
          documentName: file.name,
          messages: [{
            id: uuidv4(),
            text: '👋 Hello! I am AskNoteBot. I can help you understand your document better. What would you like to know?',
            sender: 'bot',
            timestamp: new Date()
          }],
          createdAt: new Date()
        };
        
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSessionId);
        targetSessionId = newSessionId;
      }
      
      // Store document text
      setSessionDocuments(prev => ({
        ...prev,
        [targetSessionId]: { text: result.fullText, name: file.name }
      }));
      
      toast({
        title: "Success",
        description: "Document uploaded successfully. Ready to chat!",
      });
    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: "Error",
        description: "Failed to process the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send a chat message and get response
  const handleSendMessage = async (question: string) => {
    if (!activeSessionId) {
      // Create a session if none exists
      createNewSession();
      return;
    }
    
    setIsLoading(true);
    
    // Add user message to the current session
    const userMessage: ChatMessage = {
      id: uuidv4(),
      text: question,
      sender: 'user',
      timestamp: new Date()
    };
    
    setSessions(prev => prev.map(session => 
      session.id === activeSessionId
        ? { ...session, messages: [...session.messages, userMessage] }
        : session
    ));
    
    try {
      const documentText = sessionDocuments[activeSessionId]?.text || '';
      if (!documentText) {
        throw new Error('No document available');
      }
      
      const { context, pages } = findRelevantContext(documentText, [], question);
      const answer = await generateAnswer(context, pages, question);
      
      // Add bot response to the conversation
      const botMessage: ChatMessage = {
        id: uuidv4(),
        text: answer,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setSessions(prev => prev.map(session => 
        session.id === activeSessionId
          ? { ...session, messages: [...session.messages, botMessage] }
          : session
      ));
    } catch (error) {
      console.error('Error answering question:', error);
      
      toast({
        title: "Error",
        description: "Failed to process your question. Please try again.",
        variant: "destructive"
      });
      
      // Add error message to the conversation
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        text: "I encountered an error while processing your question. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setSessions(prev => prev.map(session => 
        session.id === activeSessionId
          ? { ...session, messages: [...session.messages, errorMessage] }
          : session
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a single chat session
  const deleteSession = (sessionId: string) => {
    // Remove the session
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    
    // Clean up document data
    setSessionDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[sessionId];
      return newDocs;
    });
    
    // If active session is deleted, set active to next available
    if (activeSessionId === sessionId) {
      setActiveSessionId(sessions.find(s => s.id !== sessionId)?.id || null);
    }
    
    toast({
      title: "Chat Deleted",
      description: "The chat session has been removed.",
    });
  };

  // Delete all chat sessions
  const deleteAllSessions = () => {
    setSessions([]);
    setSessionDocuments({});
    setActiveSessionId(null);
    
    // Clear localStorage
    localStorage.removeItem('chatSessions');
    localStorage.removeItem('sessionDocuments');
    
    toast({
      title: "All Chats Deleted",
      description: "All chat sessions have been removed.",
    });
  };

  // Select a chat session
  const selectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <div className="w-64 border-r bg-gray-50 flex flex-col">
          <ChatSessionManager
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={selectSession}
            onCreateNewSession={createNewSession}
            onDeleteSession={deleteSession}
            onDeleteAllSessions={deleteAllSessions}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="border-b p-4 flex justify-between items-center">
            <Button 
              variant="ghost" 
              className="flex items-center text-gray-600"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="text-lg font-medium">
              {activeSession?.name || 'AskNoteBot'}
            </div>
            <div className="w-24"></div> {/* Spacer for alignment */}
          </div>

          <div className="flex-1">
            {activeSessionId ? (
              <ChatInterface 
                messages={activeSession?.messages || []}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                pdfText={activePdfText}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-8 rounded-lg max-w-md">
                  <h3 className="text-xl font-semibold mb-2">
                    Please upload a document or create a new chat
                  </h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
