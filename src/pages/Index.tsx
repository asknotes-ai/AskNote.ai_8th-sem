
import { FileText, MessageSquare, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';

const Index = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16 flex-grow">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 mb-6 leading-tight">
            Create AI-Powered Document Conversations 10X Faster
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Upload documents to AskNotes.AI and start intelligent conversations.
            Smart, simple, and adorable.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-6 text-lg"
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Document Processing</h3>
            <p className="text-gray-600">
              Upload any document and our AI will analyze and understand its content.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Interactive Chat</h3>
            <p className="text-gray-600">
              Have natural conversations about your documents with our AI assistant.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <History className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Knowledge History</h3>
            <p className="text-gray-600">
              Access your chat history and documents anytime you need them.
            </p>
          </Card>
        </div>
      </main>

      <footer className="border-t py-8 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} AskNotes.AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
