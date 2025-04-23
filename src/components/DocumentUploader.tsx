import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { File, Heart, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const DocumentUploader = ({ onFileUpload, isLoading }: DocumentUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (isValidFileType(file.type)) {
        onFileUpload(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isValidFileType(file.type)) {
        onFileUpload(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
          variant: "destructive"
        });
      }
    }
  };

  const isValidFileType = (fileType: string): boolean => {
    return fileType === 'application/pdf';
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-4 text-center transition-all duration-300",
        "hover:border-primary hover:shadow-lg hover:scale-[1.02]",
        "dark:border-gray-700 dark:hover:border-blue-500",
        "bg-gradient-to-br from-background to-background/50 backdrop-blur-sm",
        isDragging 
          ? "border-blue-500 bg-blue-50/10" 
          : "border-gray-200",
        "transform transition-transform duration-200 ease-in-out"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf"
        onChange={handleFileSelect}
      />
      <div className="relative">
        <FileText className="mx-auto h-8 w-8 text-primary mb-2 transform transition-transform group-hover:scale-110 duration-200" />
        <h3 className="text-base font-medium mb-2">
          📄 Upload Document
        </h3>
        <Button 
          onClick={handleButtonClick} 
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
        >
          {isLoading ? 'Processing...' : 'Choose File'}
        </Button>
      </div>
    </div>
  );
};

export default DocumentUploader;
