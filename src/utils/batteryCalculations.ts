
import { BatteryData } from "@/types/battery";

/**
 * Calculates the State of Charge (SOC) for a battery data point
 * Based on the nominal capacity of 6.5Ah
 * 
 * @param dataPoint The current data point
 * @param allData All data points in the test
 * @param nominalCapacity The nominal capacity in Ah (default: 6.5Ah)
 * @returns SOC percentage (can be over 100% for overcharged batteries)
 */
export const calculateBatterySOC = (
  dataPoint: BatteryData, 
  allData: BatteryData[], 
  nominalCapacity: number = 6.5
): number => {
  // Get the index of the current data point
  const currentIndex = allData.findIndex(d => 
    d.time === dataPoint.time && 
    d.voltage === dataPoint.voltage && 
    d.current === dataPoint.current
  );
  
  if (currentIndex === -1) return 0;
  
  // Check if we have current data to calculate coulomb counting
  const hasCurrentData = allData.some(d => typeof d.current === 'number' && !isNaN(d.current));
  
  // If we don't have current data, estimate SOC based on position in the dataset
  if (!hasCurrentData) {
    // Simple approach: linear interpolation based on position in the dataset
    return (currentIndex / (allData.length - 1)) * 100;
  }
  
  let ampHours = 0;
  
  // Calculate accumulated charge until this point (coulomb counting)
  // Time should be in hours for Ah calculation, so we'll convert seconds to hours
  for (let i = 0; i < currentIndex; i++) {
    const point = allData[i];
    const nextPoint = allData[i + 1];
    
    if (nextPoint) {
      // Calculate time difference in hours
      const timeDiff = (nextPoint.time - point.time) / 3600;
      
      // Average current during this time interval
      const avgCurrent = (point.current + nextPoint.current) / 2;
      
      // Add to accumulated charge (Ah)
      // Positive current means charging, negative means discharging
      ampHours += avgCurrent * timeDiff;
    }
  }
  
  // Calculate SOC as percentage of nominal capacity
  // Start from 100% and subtract the used capacity
  const soc = 100 - (ampHours / nominalCapacity * 100);
  
  // Allow SOC to be above 100% for overcharged batteries
  return Math.max(0, soc);
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
