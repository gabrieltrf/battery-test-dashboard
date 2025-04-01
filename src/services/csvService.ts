
import { BatteryTest, BatteryData } from "@/types/battery";

export function parseCSV(file: File): Promise<BatteryData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n");
        const headers = lines[0].split(",").map(header => header.trim());
        
        const data: BatteryData[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(",").map(value => value.trim());
          const entry: Record<string, number> = {};
          
          headers.forEach((header, index) => {
            entry[header] = parseFloat(values[index]);
          });
          
          data.push({
            time: entry.time || 0,
            voltage: entry.voltage || 0,
            current: entry.current || 0,
            temperature: entry.temperature || 0,
            ...entry
          });
        }
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
    reader.readAsText(file);
  });
}

export function extractBatteryInfo(fileName: string): { packNumber: number; moduleNumber: number } {
  const regex = /B(\d+)MD(\d+)/;
  const match = fileName.match(regex);
  
  if (match && match.length >= 3) {
    return {
      packNumber: parseInt(match[1], 10),
      moduleNumber: parseInt(match[2], 10)
    };
  }
  
  return {
    packNumber: 0,
    moduleNumber: 0
  };
}

// Armazenamento em memória para os testes de bateria
let batteryTests: BatteryTest[] = [];

export const BatteryTestService = {
  getAll: (): BatteryTest[] => {
    return batteryTests;
  },
  
  getById: (id: string): BatteryTest | undefined => {
    return batteryTests.find(test => test.id === id);
  },
  
  add: async (file: File): Promise<BatteryTest> => {
    try {
      const data = await parseCSV(file);
      const { packNumber, moduleNumber } = extractBatteryInfo(file.name);
      
      const newTest: BatteryTest = {
        id: Date.now().toString(),
        fileName: file.name,
        packNumber,
        moduleNumber,
        uploadDate: new Date(),
        data
      };
      
      batteryTests = [...batteryTests, newTest];
      return newTest;
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      throw error;
    }
  },
  
  delete: (id: string): void => {
    batteryTests = batteryTests.filter(test => test.id !== id);
  },
  
  filterTests: (packNumber?: number, moduleNumber?: number): BatteryTest[] => {
    return batteryTests.filter(test => {
      const packMatch = packNumber === undefined || test.packNumber === packNumber;
      const moduleMatch = moduleNumber === undefined || test.moduleNumber === moduleNumber;
      return packMatch && moduleMatch;
    });
  }
};
