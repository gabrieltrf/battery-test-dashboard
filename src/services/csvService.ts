
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
        
        // Handle different line endings (CRLF, LF, CR)
        const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
        
        if (lines.length < 1) {
          reject(new Error("Arquivo CSV não contém linhas"));
          return;
        }
        
        // Try to detect the delimiter (comma or semicolon)
        const firstLine = lines[0];
        let delimiter = ',';
        if (firstLine.includes(';') && !firstLine.includes(',')) {
          delimiter = ';';
        }
        
        const headers = firstLine.split(delimiter).map(header => header.trim());
        console.log("CSV Headers detected:", headers);
        
        if (headers.length < 2) {
          reject(new Error("Formato de CSV inválido: pelo menos 2 colunas são necessárias"));
          return;
        }
        
        const data: BatteryData[] = [];
        let validRowCount = 0;
        
        // Start from the second line (skip headers)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(delimiter).map(value => value.trim());
          
          // Skip rows with different column count than headers
          if (values.length !== headers.length) {
            console.warn(`Line ${i+1} has ${values.length} columns instead of ${headers.length}, skipping`);
            continue;
          }
          
          const entry: Record<string, number> = {};
          let hasValidData = false;
          
          headers.forEach((header, index) => {
            // Try to parse the value as a number
            const rawValue = values[index];
            // Handle different number formats (e.g., "1.23", "1,23")
            const normalizedValue = rawValue.replace(',', '.');
            const value = parseFloat(normalizedValue);
            
            if (!isNaN(value)) {
              entry[header] = value;
              hasValidData = true;
            }
          });
          
          if (hasValidData) {
            // Check for required fields or assign defaults
            const dataPoint: BatteryData = {
              time: 'time' in entry ? entry.time : i - 1, // Default to row index if time not found
              voltage: 'voltage' in entry ? entry.voltage : (entry.tensao || 0), // Try both English and Portuguese names
              current: 'current' in entry ? entry.current : (entry.corrente || 0),
              temperature: 'temperature' in entry ? entry.temperature : (entry.temperatura || 0),
            };
            
            // Add any additional fields
            Object.keys(entry).forEach(key => {
              if (!['time', 'voltage', 'current', 'temperature'].includes(key)) {
                dataPoint[key] = entry[key];
              }
            });
            
            data.push(dataPoint);
            validRowCount++;
          }
        }
        
        console.log(`CSV parsed successfully: ${validRowCount} valid data points found`);
        
        if (data.length === 0) {
          reject(new Error("Nenhum dado válido encontrado no arquivo"));
          return;
        }
        
        resolve(data);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        reject(new Error("Erro ao processar o arquivo CSV"));
      }
    };
    
    reader.onerror = () => {
      console.error("FileReader error");
      reject(new Error("Não foi possível ler o arquivo"));
    };
    
    reader.readAsText(file);
  });
}

export function extractBatteryInfo(fileName: string): { packNumber: number; moduleNumber: number } {
  // Improved regex to handle different filename formats
  const regex = /B(\d+)MD(\d+)|B(\d+)[^0-9]+(\d+)|Pack(\d+)[^0-9]+(\d+)/i;
  const match = fileName.match(regex);
  
  if (match) {
    // Check which capturing groups matched
    const packNumber = parseInt(match[1] || match[3] || match[5] || "0", 10);
    const moduleNumber = parseInt(match[2] || match[4] || match[6] || "0", 10);
    
    return {
      packNumber,
      moduleNumber
    };
  }
  
  console.log("Could not extract pack/module from filename:", fileName);
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
