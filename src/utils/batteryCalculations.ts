import { BatteryData } from "@/types/battery";

/**
 * Calculates the State of Charge (SOC) for a battery data point
 * Based on the nominal capacity of 6.5Ah
 * 
 * @param dataPoint The current data point
 * @param allData All data points in the test
 * @param nominalCapacity The nominal capacity in Ah (default: 6.5Ah)
 * @param allowOvercharge Whether to allow SOC > 100% (default: false)
 * @returns SOC percentage (0-100% or >100% if allowed)
 */
export const calculateBatterySOC = (
  dataPoint: BatteryData, 
  allData: BatteryData[], 
  nominalCapacity: number = 6.5,
  allowOvercharge: boolean = false // Novo parâmetro para permitir >100%
): number => {
  // Obter o índice do ponto de dados atual
  const currentIndex = allData.findIndex(d => 
    d.time === dataPoint.time && 
    d.voltage === dataPoint.voltage && 
    d.current === dataPoint.current
  );

  if (currentIndex === -1) return 0;

  // Verificar se há dados de corrente para cálculo
  const hasCurrentData = allData.some(d => typeof d.current === 'number' && !isNaN(d.current));

  // Estimar SOC com base na posição no conjunto de dados, se não houver corrente
  if (!hasCurrentData) {
    return (currentIndex / (allData.length - 1)) * 100;
  }

  let ampHours = 0;

  // Calcular carga acumulada (coulomb counting)
  for (let i = 0; i < currentIndex; i++) {
    const point = allData[i];
    const nextPoint = allData[i + 1];

    if (nextPoint) {
      const timeDiff = (nextPoint.time - point.time) / 3600; // Diferença de tempo em horas
      const avgCurrent = (point.current + nextPoint.current) / 2; // Corrente média
      ampHours += avgCurrent * timeDiff; // Acumular carga
    }
  }

  // Calcular SOC como porcentagem da capacidade nominal
  const soc = 100 - (ampHours / nominalCapacity * 100);

  // Limitar SOC condicionalmente
  if (!allowOvercharge) {
    return Math.max(0, Math.min(100, soc)); // Entre 0% e 100%
  } else {
    return Math.max(0, soc); // Permitir >100%, mas não <0%
  }
};

/**
 * Calculates the total Wh during discharge cycles
 * Only considers data points where current is negative (discharge)
 * 
 * @param data Battery test data
 * @returns Total Wh during discharge
 */
export const calculateDischargeWh = (data: BatteryData[]): number => {
  let totalWh = 0;
  
  for (let i = 0; i < data.length - 1; i++) {
    const currentPoint = data[i];
    const nextPoint = data[i + 1];
    
    // Only consider discharge points (negative current)
    if (currentPoint.current < 0) {
      // Calculate time difference in hours
      const timeDiff = (nextPoint.time - currentPoint.time) / 3600;
      
      // Calculate average power during this interval (Voltage * Current)
      const avgPower = ((currentPoint.voltage * Math.abs(currentPoint.current)) + 
                        (nextPoint.voltage * Math.abs(nextPoint.current))) / 2;
      
      // Add to total Wh
      totalWh += avgPower * timeDiff;
    }
  }
  
  return totalWh;
};
