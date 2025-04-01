
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BatteryTest } from "@/types/battery";
import { BatteryTestService } from "@/services/csvService";
import { Search, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TestsListProps {
  tests: BatteryTest[];
  onTestDeleted: () => void;
}

const TestsList = ({ tests, onTestDeleted }: TestsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [packFilter, setPackFilter] = useState<number | undefined>(undefined);
  const [moduleFilter, setModuleFilter] = useState<number | undefined>(undefined);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    BatteryTestService.delete(id);
    toast({
      title: "Teste removido",
      description: "O teste foi removido com sucesso.",
    });
    onTestDeleted();
  };

  const handleViewTest = (id: string) => {
    navigate(`/test/${id}`);
  };

  const filteredTests = tests
    .filter((test) => {
      return (
        test.fileName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (packFilter === undefined || test.packNumber === packFilter) &&
        (moduleFilter === undefined || test.moduleNumber === moduleFilter)
      );
    })
    .sort(
      (a, b) => b.uploadDate.getTime() - a.uploadDate.getTime()
    );

  const uniquePacks = Array.from(
    new Set(tests.map((test) => test.packNumber))
  ).sort((a, b) => a - b);

  const uniqueModules = Array.from(
    new Set(tests.map((test) => test.moduleNumber))
  ).sort((a, b) => a - b);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Testes de Bateria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <Input
                placeholder="Pesquisar por nome de arquivo..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 bg-white border rounded-md text-sm"
                value={packFilter === undefined ? "" : packFilter}
                onChange={(e) =>
                  setPackFilter(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              >
                <option value="">Todos os Packs</option>
                {uniquePacks.map((pack) => (
                  <option key={pack} value={pack}>
                    Pack {pack}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2 bg-white border rounded-md text-sm"
                value={moduleFilter === undefined ? "" : moduleFilter}
                onChange={(e) =>
                  setModuleFilter(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              >
                <option value="">Todos os Módulos</option>
                {uniqueModules.map((module) => (
                  <option key={module} value={module}>
                    Módulo {module}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredTests.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Pack</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Data de Upload</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>{test.fileName}</TableCell>
                      <TableCell>Pack {test.packNumber}</TableCell>
                      <TableCell>Módulo {test.moduleNumber}</TableCell>
                      <TableCell>
                        {test.uploadDate.toLocaleDateString("pt-BR")} {" "}
                        {test.uploadDate.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTest(test.id)}
                          >
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(test.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <p>Nenhum teste encontrado.</p>
              {(searchTerm || packFilter !== undefined || moduleFilter !== undefined) && (
                <p className="mt-1">Tente ajustar os filtros.</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestsList;
