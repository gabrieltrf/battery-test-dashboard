
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { BatteryTestService } from "@/services/csvService";
import { BatteryTest } from "@/types/battery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Battery, Clock, Package, Layers } from "lucide-react";

const TestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<BatteryTest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const testData = BatteryTestService.getById(id);
      setTest(testData || null);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Gráfico de Tensão x Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={test.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="voltage" stroke="#3B82F6" name="Tensão" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Gráfico de Corrente x Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={test.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="current" stroke="#10B981" name="Corrente" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Gráfico de Temperatura x Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={test.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#EF4444" name="Temperatura" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestDetails;
