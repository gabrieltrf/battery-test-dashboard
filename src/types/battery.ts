
export interface BatteryTest {
  id: string;
  fileName: string;
  packNumber: number;
  moduleNumber: number;
  uploadDate: Date;
  data: BatteryData[];
}

export interface BatteryData {
  time: number;
  voltage: number;
  current: number;
  soc?: number; // Added SOC as an optional field
  [key: string]: number | string | undefined; // For other columns that might exist in the CSV
}
