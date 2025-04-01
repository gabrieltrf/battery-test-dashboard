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
        
        console.log("Conteúdo do arquivo:", text.substring(0, 200) + "...");
        
        // Handle different line endings (CRLF, LF, CR)
        const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0);
        
        if (lines.length < 2) {
          reject(new Error("O arquivo não contém dados suficientes"));
          return;
        }
        
        // Skip any initial metadata line that doesn't look like a header
        let headerIndex = 0;
        if (lines[0].includes('@') || !lines[0].toLowerCase().includes('voltage')) {
          console.log("Pulando linha de metadados:", lines[0]);
          headerIndex = 1;
        }
        
        if (headerIndex >= lines.length) {
          reject(new Error("Não foi possível encontrar o cabeçalho no arquivo"));
          return;
        }
        
        // Try to detect the delimiter (tab, comma or semicolon)
        const headerLine = lines[headerIndex];
        let delimiter = ',';
        if (headerLine.includes(';') && !headerLine.includes(',')) {
          delimiter = ';';
        } else if (headerLine.includes('\t') && !headerLine.includes(',')) {
          delimiter = '\t';
        }
        
        console.log("Usando delimitador:", delimiter === '\t' ? "TAB" : delimiter);
        
        const headers = headerLine.split(delimiter).map(header => header.trim());
        console.log("Headers detectados:", headers);
        
        // Ensure we have at least voltage and current columns
        if (headers.length < 2) {
          reject(new Error("Formato de CSV inválido: pelo menos 2 colunas são necessárias"));
          return;
        }
        
        const data: BatteryData[] = [];
        let validRowCount = 0;
        
        // Start from the line after the header
        for (let i = headerIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(delimiter).map(value => value.trim());
          
          // Skip rows with different column count than headers
          if (values.length !== headers.length) {
            console.warn(`Linha ${i+1} possui ${values.length} colunas ao invés de ${headers.length}, ignorando`);
            continue;
          }
          
          const entry: Record<string, number | string> = {};
          let hasValidData = false;
          
          headers.forEach((header, index) => {
            // Get the raw value
            const rawValue = values[index];
            
            // Parse time values
            if (header.toLowerCase().includes('time') && rawValue.includes(':')) {
              entry[header] = rawValue;
              hasValidData = true;
              return;
            }
            
            // Handle numbers with different formats
            // - Replace comma with dot for decimal separator
            const normalizedValue = rawValue.replace(',', '.');
            const value = parseFloat(normalizedValue);
            
            if (!isNaN(value)) {
              entry[header] = value;
              hasValidData = true;
            } else {
              // Keep non-numeric values as strings
              entry[header] = rawValue;
            }
          });
          
          if (hasValidData) {
            // Map fields to standard BatteryData structure
            const dataPoint: BatteryData = {
              // Use index for time if no numeric time field found
              time: i - headerIndex - 1,
              voltage: 0,
              current: 0,
              temperature: 0
            };
            
            // Map relevant fields
            headers.forEach((header, index) => {
              const headerLower = header.toLowerCase();
              const value = entry[header];
              
              if (headerLower.includes('volt')) {
                dataPoint.voltage = typeof value === 'number' ? value : 0;
              }
              else if (headerLower.includes('curr')) {
                dataPoint.current = typeof value === 'number' ? value : 0;
              }
              else if (headerLower.includes('temp') || headerLower === 'temperature') {
                dataPoint.temperature = typeof value === 'number' ? value : 0;
              }
              else if (headerLower === 'testtime' && typeof value === 'string' && value.includes(':')) {
                // Convert HH:MM:SS to seconds for plotting
                const timeParts = value.split(':').map(Number);
                if (timeParts.length === 3) {
                  dataPoint.time = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                }
              }
              
              // Add all numeric fields to the datapoint
              if (typeof value === 'number') {
                dataPoint[headerLower] = value;
              }
            });
            
            data.push(dataPoint);
            validRowCount++;
          }
        }
        
        console.log(`CSV processado com sucesso: ${validRowCount} pontos de dados válidos encontrados`);
        
        if (data.length === 0) {
          reject(new Error("Nenhum dado válido encontrado no arquivo"));
          return;
        }
        
        resolve(data);
      } catch (error) {
        console.error("Erro ao processar CSV:", error);
        reject(new Error("Erro ao processar o arquivo CSV"));
      }
    };
    
    reader.onerror = () => {
      console.error("Erro no FileReader");
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
