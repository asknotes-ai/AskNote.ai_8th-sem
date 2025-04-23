
import React, { useState, useEffect } from 'react';
import { Trash2, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import DocumentUploader from '@/components/DocumentUploader';
import { useToast } from '@/hooks/use-toast';

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  documentName?: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatSessionManagerProps {
  onFileUpload: (file: File, sessionId?: string) => Promise<void>;
  isLoading: boolean;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onDeleteAllSessions: () => void;
}

const ChatSessionManager: React.FC<ChatSessionManagerProps> = ({
  onFileUpload,
  isLoading,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateNewSession,
  onDeleteSession,
  onDeleteAllSessions
}) => {
  const { toast } = useToast();
  const [sessionUploaders, setSessionUploaders] = useState<Record<string, boolean>>({});

  // Toggle file uploader for a specific session
  const toggleSessionUploader = (sessionId: string) => {
    setSessionUploaders(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  // Get session name or fallback to date
  const getSessionName = (session: ChatSession): string => {
    if (session.name && session.name !== 'New Chat') {
      return session.name;
    }
    
    // Get first user question as name if available
    const firstQuestion = session.messages.find(m => m.sender === 'user')?.text;
    if (firstQuestion) {
      // Truncate if too long
      return firstQuestion.length > 20 
        ? firstQuestion.substring(0, 20) + '...' 
        : firstQuestion;
    }
    
    // Fallback to document name or date
    return session.documentName || `Chat ${formatDate(session.createdAt)}`;
  };

  // Handle file upload for a specific session
  const handleFileUploadForSession = async (file: File, sessionId?: string) => {
    await onFileUpload(file, sessionId);
    // Close the uploader after successful upload
    if (sessionId) {
      setSessionUploaders(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Main Document Uploader */}
      <div className="border-b p-4">
        <h3 className="text-sm font-medium mb-2">Upload Document</h3>
        <DocumentUploader 
          onFileUpload={(file) => handleFileUploadForSession(file)} 
          isLoading={isLoading}
        />
      </div>
      
      {/* Chat History Section */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-sm font-medium">
            Chat History ({sessions.length}/20)
          </h3>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCreateNewSession}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Chat
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDeleteAllSessions}
              disabled={isLoading || sessions.length === 0}
              className="text-red-500 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-56px)]">
          <div className="p-2 space-y-1">
            {sessions.map(session => (
              <div 
                key={session.id}
                className={`group p-2 rounded-md flex items-center justify-between cursor-pointer hover:bg-gray-100 ${
                  activeSessionId === session.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex items-center truncate flex-1">
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
                  <span className="truncate text-sm">
                    {getSessionName(session)}
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="text-center p-4 text-gray-500 text-sm">
                No chat history yet
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ChatSessionManager;
