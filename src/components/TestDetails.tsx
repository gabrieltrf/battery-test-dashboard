
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatteryTestService } from "@/services/csvService";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { BatteryData } from "@/types/battery";

const TestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("voltage");

  if (!id) {
    return <div className="text-center my-8">ID do teste não encontrado.</div>;
  }

  const test = BatteryTestService.getById(id);

  if (!test) {
    return (
      <div className="text-center my-8">
        <p className="text-lg">Teste não encontrado.</p>
        <Button className="mt-4" onClick={() => navigate("/")}>
          Voltar para Dashboard
        </Button>
      </div>
    );
  }

  // Preparar os dados para o gráfico, limitando a 1000 pontos para performance
  const sampleData = (data: BatteryData[], maxPoints: number = 1000) => {
    if (data.length <= maxPoints) return data;
    
    const samplingRate = Math.floor(data.length / maxPoints);
    return data.filter((_, index) => index % samplingRate === 0);
  };
  
  const chartData = sampleData(test.data);

  const downloadCSV = () => {
    const headers = Object.keys(test.data[0]);
    const csvContent = [
      headers.join(","),
      ...test.data.map(row => headers.map(header => row[header]).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = test.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate("/")} className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {test.fileName} - Pack {test.packNumber}, Módulo {test.moduleNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            Carregado em {test.uploadDate.toLocaleDateString("pt-BR")}, {test.uploadDate.toLocaleTimeString("pt-BR")}
          </p>
        </div>
        <div className="ml-auto">
          <Button onClick={downloadCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Baixar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Número de pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{test.data.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tensão Máxima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...test.data.map(d => d.voltage)).toFixed(2)} V
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Temperatura Máxima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...test.data.map(d => d.temperature)).toFixed(1)} °C
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="voltage">Tensão</TabsTrigger>
          <TabsTrigger value="current">Corrente</TabsTrigger>
          <TabsTrigger value="temperature">Temperatura</TabsTrigger>
          <TabsTrigger value="data">Dados Brutos</TabsTrigger>
        </TabsList>

        <TabsContent value="voltage" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Gráfico de Tensão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Tempo (s)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Tensão (V)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value) => [`${value} V`, 'Tensão']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="voltage" 
                      stroke="#2563eb" 
                      name="Tensão" 
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Gráfico de Corrente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Tempo (s)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Corrente (A)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value) => [`${value} A`, 'Corrente']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#10b981" 
                      name="Corrente" 
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temperature" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Gráfico de Temperatura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Tempo (s)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Temperatura (°C)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value) => [`${value} °C`, 'Temperatura']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#ef4444" 
                      name="Temperatura" 
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="mt-0">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados Brutos
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Mostrando primeiros 100 registros
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        {Object.keys(test.data[0]).map((header) => (
                          <th
                            key={header}
                            className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {test.data.slice(0, 100).map((row, index) => (
                        <tr key={index}>
                          {Object.keys(row).map((key) => (
                            <td
                              key={key}
                              className="px-6 py-2 whitespace-nowrap text-sm text-gray-900"
                            >
                              {row[key as keyof typeof row].toFixed(4)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestDetails;
