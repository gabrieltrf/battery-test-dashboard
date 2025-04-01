
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BatteryTestService } from "@/services/csvService";

interface FileUploadProps {
  onFileUploaded: () => void;
}

const FileUpload = ({ onFileUploaded }: FileUploadProps) => {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useState<HTMLInputElement | null>(null);

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
      await processFiles(files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  };

  const handleButtonClick = () => {
    // Trigger the hidden file input click
    document.getElementById("file-upload")?.click();
  };

  const processFiles = async (files: FileList) => {
    setLoading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        try {
          await BatteryTestService.add(file);
          toast({
            title: "Arquivo carregado com sucesso!",
            description: `${file.name} foi processado e adicionado à lista.`,
          });
        } catch (error) {
          toast({
            title: "Erro ao processar arquivo",
            description: `Não foi possível processar ${file.name}. Verifique o formato do arquivo.`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, carregue apenas arquivos CSV.",
          variant: "destructive",
        });
      }
    }
    
    setLoading(false);
    onFileUploaded();
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
            {loading ? "Processando..." : "Selecionar Arquivos"}
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>
      </div>
    </Card>
  );
};

export default FileUpload;
