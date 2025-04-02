
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BatteryTestService } from "@/services/csvService";
import { BatteryData, BatteryTest } from "@/types/battery";
import { Button } from "@/components/ui/button";
import { calculateBatterySOC, calculateDischargeWh } from "@/utils/batteryCalculations";
import { BatteryInfoCards } from "./BatteryInfoCards";
import { BatteryDataChart } from "./BatteryDataChart";

export const TestDetailsContainer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<BatteryTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [dischargeWh, setDischargeWh] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      const testData = BatteryTestService.getById(id);
      setTest(testData || null);
      
      if (testData) {
        // Calculate discharge Wh when test data is loaded
        const wh = calculateDischargeWh(testData.data);
        setDischargeWh(wh);
      }
      
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-center items-center h-64">
          <p className="text-xl">Carregando dados do teste...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-center items-center h-64">
          <p className="text-xl">Teste não encontrado. O teste pode ter sido excluído.</p>
        </div>
      </div>
    );
  }

  // Process data to include SOC values (based on 6.5Ah capacity)
  const dataWithSOC = test.data.map(item => {
    return {
      ...item,
      soc: calculateBatterySOC(item, test.data, 6.5)
    };
  });

  // Filter discharge data (where current is negative)
  const dischargeData = test.data.filter(item => item.current < 0);
  
  // Process discharge data with SOC - invert the SOC so it goes from 100% to 0%
  const dischargeDataWithSOC = dischargeData.map(item => {
    let calculatedSoc = calculateBatterySOC(item, test.data, 6.5);
    
    // Find the max SOC among discharge data points to normalize to 100%
    const maxDischargeSOC = Math.max(
      ...dischargeData.map(d => calculateBatterySOC(d, test.data, 6.5))
    );
    
    // Normalize SOC to 100% for discharge
    const normalizedSoc = (calculatedSoc / maxDischargeSOC) * 100;
    
    // Invert SOC for discharge (100% to 0%)
    const invertedSoc = 100 - normalizedSoc;
    
    return {
      ...item,
      soc: invertedSoc
    };
  });
  
  // Filter charge data (where current is positive)
  const chargeData = test.data.filter(item => item.current > 0);
  
  // Process charge data with SOC
  const chargeDataWithSOC = chargeData.map(item => {
    return {
      ...item,
      soc: calculateBatterySOC(item, test.data, 6.5)
    };
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{test.fileName}</h1>
          <div className="text-sm text-muted-foreground">
            Dados detalhados do teste de bateria
          </div>
        </div>
      </div>

      <BatteryInfoCards test={test} dischargeWh={dischargeWh} />

      <div className="grid grid-cols-1 gap-6">
        <BatteryDataChart 
          data={dataWithSOC} 
          title="Tensão x Estado de Carga (SOC)" 
          lineColor="#3B82F6" 
          lineName="Tensão" 
          domain={[0, 'auto']} 
        />

        <BatteryDataChart 
          data={dischargeDataWithSOC} 
          title="Gráfico de Descarga da Bateria (Tensão x SOC)" 
          lineColor="#3B82F6" 
          lineName="Tensão (Descarga)" 
          domain={[0, 100]} 
        />

        <BatteryDataChart 
          data={chargeDataWithSOC} 
          title="Gráfico de Carga da Bateria (Tensão x SOC)" 
          lineColor="#10B981" 
          lineName="Tensão (Carga)" 
          domain={[0, 'auto']} 
        />
      </div>

      <Button
        onClick={() => navigate(-1)}
        className="mt-4"
        variant="default"
      >
        Voltar
      </Button>
    </div>
  );
};
