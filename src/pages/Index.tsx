
import { useState, useEffect } from "react";
import FileUpload from "@/components/FileUpload";
import TestsList from "@/components/TestsList";
import { BatteryTestService } from "@/services/csvService";
import { BatteryTest } from "@/types/battery";
import { Battery, BarChart3 } from "lucide-react";

const Index = () => {
  const [tests, setTests] = useState<BatteryTest[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setTests(BatteryTestService.getAll());
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-battery-blue p-3 rounded-full">
              <Battery className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Dashboard de Testes de Bateria</h1>
              <p className="text-muted-foreground">
                Gerencie e visualize testes de bateria a partir de arquivos CSV
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 text-battery-blue">
            <BarChart3 className="h-5 w-5" />
            <span className="font-semibold">
              {tests.length} {tests.length === 1 ? "teste" : "testes"} carregados
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <FileUpload onFileUploaded={handleRefresh} />
        <TestsList tests={tests} onTestDeleted={handleRefresh} />
      </div>
    </div>
  );
};

export default Index;
