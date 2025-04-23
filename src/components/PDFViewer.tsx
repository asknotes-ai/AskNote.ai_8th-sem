
import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { FileText, Search } from 'lucide-react';

// Set the PDF.js worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | null;
}

const PDFViewer = ({ file }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageRendering, setPageRendering] = useState<boolean>(false);
  const [pageText, setPageText] = useState<string>('');
  const [scale, setScale] = useState<number>(1.5);

  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      try {
        const fileReader = new FileReader();
        
        fileReader.onload = async function() {
          const typedArray = new Uint8Array(this.result as ArrayBuffer);
          const loadingTask = pdfjsLib.getDocument({ data: typedArray });
          const pdf = await loadingTask.promise;
          
          setNumPages(pdf.numPages);
          
          // Load the first page by default
          if (pdf.numPages > 0) {
            renderPage(pdf, 1);
          }
        };
        
        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPDF();
  }, [file]);

  const renderPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number) => {
    if (pageRendering) return;
    
    setPageRendering(true);
    
    try {
      const canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement;
      const page = await pdf.getPage(pageNumber);
      
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: canvas.getContext('2d')!,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;

      // Extract text from the page
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map(item => 'str' in item ? item.str : '');
      setPageText(textItems.join(' '));
      
      setCurrentPage(pageNumber);
      setPageRendering(false);
    } catch (error) {
      console.error('Error rendering page:', error);
      setPageRendering(false);
    }
  };

  const changePage = async (offset: number) => {
    const newPage = currentPage + offset;
    
    if (newPage < 1 || newPage > numPages) return;
    
    if (file) {
      const fileReader = new FileReader();
      
      fileReader.onload = async function() {
        const typedArray = new Uint8Array(this.result as ArrayBuffer);
        const loadingTask = pdfjsLib.getDocument({ data: typedArray });
        const pdf = await loadingTask.promise;
        
        renderPage(pdf, newPage);
      };
      
      fileReader.readAsArrayBuffer(file);
    }
  };

  if (!file) {
    return <div className="text-center p-8 text-gray-500">No PDF file loaded</div>;
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium truncate">
          {file.name}
        </h3>
        <div className="text-sm text-gray-500">
          Page {currentPage} of {numPages}
        </div>
      </div>
      
      <div className="border border-gray-200 rounded-lg p-4 overflow-hidden bg-white">
        <div className="flex justify-center min-h-[500px]">
          <canvas id="pdf-canvas" className="max-w-full"></canvas>
        </div>
      </div>
      
      <div className="flex justify-center mt-4 space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => changePage(-1)}
          disabled={currentPage <= 1 || pageRendering}
        >
          <FileText className="h-4 w-4 mr-1" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => changePage(1)}
          disabled={currentPage >= numPages || pageRendering}
        >
          Next <FileText className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default PDFViewer;
