
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BatteryTestService } from "@/services/csvService";

interface FileUploadProps {
  onFileUploaded: () => void;
}

const FileUpload = ({ onFileUploaded }: FileUploadProps) => {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleButtonClick = () => {
    // Trigger the hidden file input click
    document.getElementById("file-upload")?.click();
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    
    try {
      console.log("Processando arquivo:", selectedFile.name, "Tipo:", selectedFile.type);
      
      await BatteryTestService.add(selectedFile);
      
      toast({
        title: "Arquivo carregado com sucesso!",
        description: `${selectedFile.name} foi processado e adicionado à lista.`,
      });
      
      setSelectedFile(null);
      onFileUploaded();
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast({
        title: "Erro ao processar arquivo",
        description: error instanceof Error ? error.message : "Verifique o formato do arquivo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className={`p-6 border-2 border-dashed transition-all ${
        dragging ? "border-battery-blue bg-battery-blue/10" : "border-gray-300"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        {selectedFile ? (
          <>
            <FileText 
              className="w-12 h-12 text-battery-blue" 
            />
            <div className="text-center">
              <h3 className="font-medium text-lg">{selectedFile.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleProcessFile} 
                disabled={loading}
              >
                {loading ? "Processando..." : "Processar Arquivo"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedFile(null)}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            <Upload
              className={`w-12 h-12 ${
                dragging ? "text-battery-blue" : "text-battery-gray"
              }`}
            />
            <div className="text-center">
              <h3 className="font-medium text-lg">
                {dragging ? "Solte o arquivo aqui" : "Arraste e solte arquivos CSV"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                ou clique para selecionar arquivos
              </p>
            </div>
            <div>
              <Button 
                onClick={handleButtonClick} 
                disabled={loading}
              >
                {loading ? "Processando..." : "Selecionar Arquivo"}
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default FileUpload;
