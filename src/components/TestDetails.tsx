import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useCallback } from "react";
import { BatteryTestService } from "@/services/csvService";
import { BatteryData, BatteryTest } from "@/types/battery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from "recharts";
import { Battery, Clock, Package, Layers, Zap } from "lucide-react";
import { calculateBatterySOC, calculateDischargeWh } from "@/utils/batteryCalculations";
import html2canvas from "html2canvas";

const exportChartAsImage = () => {
  const chartElement = document.getElementById("chart-container");
  if (chartElement) {
    html2canvas(chartElement).then((canvas) => {
      const link = document.createElement("a");
      link.download = "chart.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  }
};

const TestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<BatteryTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [dischargeWh, setDischargeWh] = useState<number | null>(null);
  const [zoomRange, setZoomRange] = useState(null);

  const handleZoom = useCallback((range) => {
    setZoomRange(range);
  }, []);

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

  // Process data to include SOC values (based on 6.5Ah capacity)
  // For all data points
  const dataWithSOC = useMemo(() => {
    if (!test) return [];
    return test.data.map((item) => ({
      ...item,
      soc: calculateBatterySOC(item, test.data, 6.5),
    }));
  }, [test]);

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

  // Filter discharge data (where current is negative)
  const dischargeData = test.data.filter(item => item.current < 0);
  
  // Process discharge data with SOC - invert the SOC so it goes from 100% to 0%
  const dischargeDataWithSOC = dischargeData.map(item => {
    const calculatedSoc = calculateBatterySOC(item, test.data, 6.5);
    // Invert SOC for discharge (100% to 0%)
    const invertedSoc = 100 - calculatedSoc;
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-battery-blue" />
              <div className="font-medium">Pack</div>
            </div>
            <div className="text-2xl font-bold mt-2">
              {test.packNumber || "Não identificado"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-battery-blue" />
              <div className="font-medium">Módulo</div>
            </div>
            <div className="text-2xl font-bold mt-2">
              {test.moduleNumber || "Não identificado"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-battery-blue" />
              <div className="font-medium">Data de Upload</div>
            </div>
            <div className="text-xl font-bold mt-2">
              {test.uploadDate.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-battery-blue" />
              <div className="font-medium">Energia de Descarga</div>
            </div>
            <div className="text-xl font-bold mt-2">
              {dischargeWh !== null ? `${dischargeWh.toFixed(2)} Wh` : "Calculando..."}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tensão x Estado de Carga (SOC)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} id="chart-container">
              <LineChart data={dataWithSOC}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="soc" />
                <YAxis />
                <Tooltip />
                <Brush dataKey="soc" height={30} stroke="#8884d8" />
                <Line type="monotone" dataKey="voltage" stroke="#3B82F6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Gráfico de Descarga da Bateria (Tensão x SOC)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dischargeDataWithSOC}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="soc" 
                  name="SOC (%)" 
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  label={{ value: 'Estado de Carga (%)', position: 'insideBottomRight', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Tensão (V)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number) => [value.toFixed(3), 'Tensão (V)']}
                  labelFormatter={(label) => `SOC: ${label.toFixed(1)}%`} // Removido o cálculo redundante
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="voltage" 
                  stroke="#3B82F6" 
                  name="Tensão (Descarga)" 
                  dot={false} 
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Gráfico de Carga da Bateria (Tensão x SOC)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chargeDataWithSOC}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="soc" 
                  name="SOC (%)" 
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  label={{ value: 'Estado de Carga (%)', position: 'insideBottomRight', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Tensão (V)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number) => [value.toFixed(3), 'Tensão (V)']}
                  labelFormatter={(label) => `SOC: ${label.toFixed(1)}%`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="voltage" 
                  stroke="#10B981" 
                  name="Tensão (Carga)" 
                  dot={false} 
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Botão "Voltar" */}
      <button
        onClick={() => navigate(-1)} // Volta para a página anterior
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Voltar
      </button>

      {/* Botão "Exportar Gráfico" */}
      <button
        onClick={exportChartAsImage}
        className="bg-green-500 text-white px-4 py-2 rounded mt-4"
      >
        Exportar Gráfico
      </button>
    </div>
  );
};

export default TestDetails;
