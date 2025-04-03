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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
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
      setSelectedFiles(Array.from(files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleButtonClick = () => {
    // Trigger the hidden file input click
    document.getElementById("file-upload")?.click();
  };

  const handleProcessFiles = async () => {
    if (selectedFiles.length === 0) return;

    setLoading(true);
    const failed = [];

    try {
      for (const file of selectedFiles) {
        try {
          console.log("Processando arquivo:", file.name, "Tipo:", file.type);
          await BatteryTestService.add(file);
        } catch (error) {
          console.error("Erro ao processar arquivo:", file.name, error);
          failed.push(file);
        }
      }

      if (failed.length > 0) {
        setFailedFiles(failed);
        toast({
          title: "Processamento concluído com erros",
          description: `${failed.length} arquivos falharam. Tente novamente.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Arquivos carregados com sucesso!",
          description: `${selectedFiles.length} arquivos foram processados e adicionados à lista.`,
        });
      }

      setSelectedFiles([]);
      onFileUploaded();
    } finally {
      setLoading(false);
    }
  };

  const retryFailedFiles = () => {
    setSelectedFiles(failedFiles);
    setFailedFiles([]);
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
        {selectedFiles.length > 0 ? (
          <>
            <FileText 
              className="w-12 h-12 text-battery-blue" 
            />
            <div className="text-center">
              <h3 className="font-medium text-lg">{selectedFiles.length} arquivos selecionados</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedFiles.map(file => file.name).join(", ")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleProcessFiles} 
                disabled={loading}
              >
                {loading ? "Processando..." : "Processar Arquivos"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedFiles([])}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </>
        ) : failedFiles.length > 0 ? (
          <>
            <AlertCircle 
              className="w-12 h-12 text-red-500" 
            />
            <div className="text-center">
              <h3 className="font-medium text-lg">{failedFiles.length} arquivos falharam</h3>
              <p className="text-sm text-gray-500 mt-1">
                {failedFiles.map(file => file.name).join(", ")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={retryFailedFiles} 
                disabled={loading}
              >
                {loading ? "Processando..." : "Tentar Novamente"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setFailedFiles([])}
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
                {dragging ? "Solte os arquivos aqui" : "Arraste e solte arquivos CSV"}
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
                {loading ? "Processando..." : "Selecionar Arquivos"}
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.txt"
                multiple
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
