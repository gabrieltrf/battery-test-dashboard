
import { BatteryTest, BatteryData } from "@/types/battery";

export function parseCSV(file: File): Promise<BatteryData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          reject(new Error("Arquivo vazio ou inválido"));
          return;
        }
        
        const lines = text.split("\n");
        if (lines.length <= 1) {
          reject(new Error("Arquivo CSV não contém dados suficientes"));
          return;
        }
        
        const headers = lines[0].split(",").map(header => header.trim());
        
        const data: BatteryData[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(",").map(value => value.trim());
          if (values.length !== headers.length) continue; // Skip malformed rows
          
          const entry: Record<string, number> = {};
          
          headers.forEach((header, index) => {
            const value = parseFloat(values[index]);
            if (!isNaN(value)) {
              entry[header] = value;
            }
          });
          
          // Ensure required fields exist
          if ('time' in entry || 'voltage' in entry || 'current' in entry || 'temperature' in entry) {
            data.push({
              time: entry.time || 0,
              voltage: entry.voltage || 0,
              current: entry.current || 0,
              temperature: entry.temperature || 0,
              ...entry
            });
          }
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

// Use localStorage to persist battery tests between sessions
const LOCAL_STORAGE_KEY = 'batteryTests';

// Load tests from localStorage on module initialization
const loadSavedTests = (): BatteryTest[] => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Convert string dates back to Date objects
      return parsed.map((test: any) => ({
        ...test,
        uploadDate: new Date(test.uploadDate)
      }));
    } catch (e) {
      console.error("Failed to load saved tests:", e);
      return [];
    }
  }
  return [];
};

// Save tests to localStorage
const saveTests = (tests: BatteryTest[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tests));
  } catch (e) {
    console.error("Failed to save tests:", e);
  }
};

// Initialize from localStorage
let batteryTests: BatteryTest[] = loadSavedTests();

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
      if (data.length === 0) {
        throw new Error("Arquivo não contém dados válidos");
      }
      
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
      saveTests(batteryTests);
      return newTest;
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      throw error;
    }
  },
  
  delete: (id: string): void => {
    batteryTests = batteryTests.filter(test => test.id !== id);
    saveTests(batteryTests);
  },
  
  filterTests: (packNumber?: number, moduleNumber?: number): BatteryTest[] => {
    return batteryTests.filter(test => {
      const packMatch = packNumber === undefined || test.packNumber === packNumber;
      const moduleMatch = moduleNumber === undefined || test.moduleNumber === moduleNumber;
      return packMatch && moduleMatch;
    });
  }
};
