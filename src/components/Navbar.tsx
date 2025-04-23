
import { Moon, Sun, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="border-b py-6 px-6 bg-white dark:bg-gray-900">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">AskNotes.AI</span>
        </Link>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Turning documents into conversations: smart, simple & adorable
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleTheme}
          className="rounded-full"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
