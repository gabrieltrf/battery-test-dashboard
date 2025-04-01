
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
  temperature: number;
  [key: string]: number; // Para outras colunas que possam existir no CSV
}
