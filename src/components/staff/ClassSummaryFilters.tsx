import { memo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Calendar as CalendarIcon, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ClassSummaryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  periodFilter: string;
  onPeriodChange: (value: string) => void;
  customStartDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  customEndDate: Date | undefined;
  onEndDateChange: (date: Date | undefined) => void;
  onReset: () => void;
}

function ClassSummaryFilters({
  searchTerm,
  onSearchChange,
  periodFilter,
  onPeriodChange,
  customStartDate,
  onStartDateChange,
  customEndDate,
  onEndDateChange,
  onReset,
}: ClassSummaryFiltersProps) {
  // Validate and set end date
  const handleEndDateChange = useCallback((date: Date | undefined) => {
    if (date && customStartDate && date < customStartDate) {
      toast.error("Tanggal akhir tidak boleh lebih kecil dari tanggal mulai");
      return;
    }
    onEndDateChange(date);
  }, [customStartDate, onEndDateChange]);

  // Validate and set start date (also clear end date if it becomes invalid)
  const handleStartDateChange = useCallback((date: Date | undefined) => {
    onStartDateChange(date);
    // If end date is now before start date, clear it
    if (date && customEndDate && customEndDate < date) {
      onEndDateChange(undefined);
      toast.info("Tanggal akhir direset karena lebih kecil dari tanggal mulai");
    }
  }, [customEndDate, onStartDateChange, onEndDateChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-wrap">
      <div className="relative flex-1 md:w-64 md:flex-none">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari kelas..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={periodFilter} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-full sm:w-48">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Pilih periode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current">Bulan Ini</SelectItem>
          <SelectItem value="last">Bulan Lalu</SelectItem>
          <SelectItem value="last3">3 Bulan Terakhir</SelectItem>
          <SelectItem value="custom">Rentang Custom</SelectItem>
        </SelectContent>
      </Select>
      
      {periodFilter === "custom" && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-40 justify-start text-left font-normal",
                  !customStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? format(customStartDate, "dd/MM/yyyy") : "Dari"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={handleStartDateChange}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-40 justify-start text-left font-normal",
                  !customEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? format(customEndDate, "dd/MM/yyyy") : "Sampai"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={handleEndDateChange}
                disabled={(date) => customStartDate ? date < customStartDate : false}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        title="Reset Filter"
        className="shrink-0"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default memo(ClassSummaryFilters);
