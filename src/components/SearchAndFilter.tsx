import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, X, Calendar, Users, Database } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface SearchFilters {
  search: string;
  status: string;
  priority: string;
  assignedTo: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  type: string;
}

interface SearchAndFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onReset: () => void;
}

export const SearchAndFilter = ({ filters, onFiltersChange, onReset }: SearchAndFilterProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'search' && value) return count + 1;
    if (key === 'dateRange' && (value.from || value.to)) return count + 1;
    if (typeof value === 'string' && value && value !== 'all') return count + 1;
    return count;
  }, 0);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by case number, lab number, title, or exhibit..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_investigation">In Progress</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => updateFilter('priority', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters Toggle */}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="default">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Exhibit Type</label>
                      <Select
                        value={filters.type}
                        onValueChange={(value) => updateFilter('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="mobile_device">Mobile Device</SelectItem>
                          <SelectItem value="computer">Computer</SelectItem>
                          <SelectItem value="storage_media">Storage Media</SelectItem>
                          <SelectItem value="network_device">Network Device</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Assigned Analyst</label>
                      <Select
                        value={filters.assignedTo}
                        onValueChange={(value) => updateFilter('assignedTo', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select analyst" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Analysts</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {/* Add dynamic analyst options here */}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Date Range</label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "flex-1 justify-start text-left font-normal",
                                !filters.dateRange.from && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {filters.dateRange.from ? format(filters.dateRange.from, "PPP") : "From"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={filters.dateRange.from}
                              onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, from: date })}
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "flex-1 justify-start text-left font-normal",
                                !filters.dateRange.to && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {filters.dateRange.to ? format(filters.dateRange.to, "PPP") : "To"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={filters.dateRange.to}
                              onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, to: date })}
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={onReset} className="flex-1">
                      <X className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    <Button size="sm" onClick={() => setIsFilterOpen(false)} className="flex-1">
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{filters.search}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('search', '')}
                />
              </Badge>
            )}
            {filters.status && filters.status !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {filters.status}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('status', 'all')}
                />
              </Badge>
            )}
            {filters.priority && filters.priority !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Priority: {filters.priority}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('priority', 'all')}
                />
              </Badge>
            )}
            {(filters.dateRange.from || filters.dateRange.to) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Date: {filters.dateRange.from ? format(filters.dateRange.from, "MMM dd") : "?"} - {filters.dateRange.to ? format(filters.dateRange.to, "MMM dd") : "?"}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('dateRange', { from: undefined, to: undefined })}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};