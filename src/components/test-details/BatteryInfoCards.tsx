
import { Battery, Clock, Package, Layers, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BatteryTest } from "@/types/battery";

interface BatteryInfoCardsProps {
  test: BatteryTest;
  dischargeWh: number | null;
}

export const BatteryInfoCards = ({ test, dischargeWh }: BatteryInfoCardsProps) => {
  return (
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
  );
};
