
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Download, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from './ChatSessionManager';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  pdfText: string;
}

const ChatInterface = ({ messages, onSendMessage, isLoading, pdfText }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading || !pdfText) {
      if (!pdfText) {
        toast({
          title: "No Document",
          description: "Please upload a document first to ask questions.",
          variant: "destructive"
        });
      }
      return;
    }
    
    const question = inputValue.trim();
    setInputValue('');
    
    try {
      await onSendMessage(question);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadChat = () => {
    const chatContent = messages
      .map(msg => `${msg.sender === 'user' ? 'You' : 'AskNoteBot'}: ${msg.text}\n`)
      .join('\n');

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-history.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-background">
      <div className="flex justify-end p-2 border-b border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadChat}
          className="flex items-center gap-2"
          disabled={messages.length === 0}
        >
          <Download className="h-4 w-4" />
          Download Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8 rounded-lg max-w-md">
              <MessageSquare className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your conversation will appear here</h3>
              <p className="text-muted-foreground">
                Ask questions about your document to get started.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              } items-start gap-2`}
            >
              {message.sender === 'bot' && (
                <Avatar className="h-8 w-8 bg-primary">
                  <AvatarFallback className="bg-primary-foreground">
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-secondary text-secondary-foreground rounded-bl-none'
                }`}
              >
                {message.sender === 'bot' ? (
                  <div className="text-sm markdown-content">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => (
                          <button
                            onClick={() => handleLinkClick(href || '')}
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            {children}
                          </button>
                        ),
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.text}</p>
                )}
                <p
                  className={`text-xs mt-1 ${
                    message.sender === 'user' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {message.sender === 'user' && (
                <Avatar className="h-8 w-8 bg-primary">
                  <AvatarFallback className="bg-primary-foreground">
                    <User className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form 
        className="border-t border-border p-4 flex items-center gap-2 bg-background dark:bg-background"
        onSubmit={handleSubmit}
      >
        <Input
          type="text"
          placeholder={
            !pdfText
              ? 'Upload a document first to ask questions'
              : isLoading
              ? 'Processing...'
              : 'Ask a question about your document...'
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1"
          disabled={isLoading || !pdfText}
        />
        <Button 
          type="submit"
          disabled={isLoading || !inputValue.trim() || !pdfText}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;
