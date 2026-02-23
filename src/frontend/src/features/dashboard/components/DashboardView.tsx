import { useMemo, useState } from 'react';
import { useGetAllCases } from '../../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ClipboardList, 
  CheckCircle2, 
  ChevronRight, 
  FileText, 
  Phone, 
  Beaker, 
  Microscope, 
  ClipboardCheck, 
  ScanLine, 
  FlaskConical,
  Search,
  Plus,
  X,
  Download
} from 'lucide-react';
import { getOpenTasksFromCase, getTotalOpenTasksCount } from '../utils/openTasksCalculation';
import { CHECKLIST_ITEMS, getTaskBorderColor, getTaskBackgroundColor } from '../../cases/checklist';
import { searchCases } from '../../cases/search';
import { filterCasesByTaskTypes, filterOutCompletedCases, filterCasesByAllTasksCompleted } from '../../cases/filtering';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import CasesTasksFilter from '../../cases/components/CasesTasksFilter';
import { sortCases } from '../../cases/sorting';
import { generateCaseReport } from '../../cases/pdf/generateCaseReport';
import type { Species, SurgeryCase } from '../../../backend';

interface DashboardViewProps {
  onNavigateToCase: (caseId: bigint) => void;
  onNewCase: () => void;
}

// Map task types to icons
const TASK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Discharge Notes': FileText,
  'pDVM Notified': Phone,
  'Labs': Beaker,
  'Histo': Microscope,
  'Surgery Report': ClipboardCheck,
  'Imaging': ScanLine,
  'Culture': FlaskConical,
};

// Map species to badge colors
function getSpeciesBadgeClass(species: Species): string {
  switch (species) {
    case 'canine':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'feline':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'other':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

function getSpeciesLabel(species: Species): string {
  switch (species) {
    case 'canine':
      return 'Canine';
    case 'feline':
      return 'Feline';
    case 'other':
      return 'Other';
    default:
      return 'Unknown';
  }
}

/**
 * Formats a Time (bigint nanoseconds) to MM/DD/YYYY string
 */
function formatArrivalDate(arrivalDate: bigint): string {
  // Convert nanoseconds to milliseconds
  const milliseconds = Number(arrivalDate / 1_000_000n);
  const date = new Date(milliseconds);
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}/${day}/${year}`;
}

export default function DashboardView({ onNavigateToCase, onNewCase }: DashboardViewProps) {
  const { data: cases = [], isLoading } = useGetAllCases();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<Set<string>>(new Set());
  const [showAllTasksCompleted, setShowAllTasksCompleted] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Filter and sort cases
  const filteredCases = useMemo(() => {
    let result = cases;

    // Apply search
    if (debouncedSearch.trim()) {
      result = searchCases(result, debouncedSearch);
    }

    // Apply "all tasks completed" filter logic
    if (showAllTasksCompleted) {
      // Show only cases where all tasks are completed
      result = filterCasesByAllTasksCompleted(result);
    } else {
      // Default: hide cases where all tasks are completed
      result = filterOutCompletedCases(result);
    }

    // Apply tasks filter (show cases with selected incomplete tasks)
    result = filterCasesByTaskTypes(result, selectedTaskTypes);

    // Sort by arrival date based on selected order
    if (sortOrder === 'newest') {
      result = sortCases(result, 'arrival-date-newest');
    } else {
      result = sortCases(result, 'arrival-date-oldest');
    }

    return result;
  }, [cases, debouncedSearch, selectedTaskTypes, showAllTasksCompleted, sortOrder]);

  const totalOpenTasks = getTotalOpenTasksCount(filteredCases);
  const allOpenTasks = filteredCases.flatMap(getOpenTasksFromCase);

  // Group tasks by case for better display
  const tasksByCase = new Map<string, typeof allOpenTasks>();
  for (const task of allOpenTasks) {
    const key = task.caseId.toString();
    if (!tasksByCase.has(key)) {
      tasksByCase.set(key, []);
    }
    tasksByCase.get(key)!.push(task);
  }

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleExportReport = () => {
    setIsGeneratingReport(true);
    try {
      // Export all cases (not just filtered ones) to include complete data
      generateCaseReport(cases);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with tally and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overview of all open tasks</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleExportReport} 
            variant="outline"
            disabled={isGeneratingReport || cases.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingReport ? 'Generating...' : 'Export Report'}
          </Button>
          <Button onClick={onNewCase}>
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </div>
      </div>

      {/* Search Bar, Sort, and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by MRN, name, or presenting complaint..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'newest' | 'oldest')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
        <CasesTasksFilter
          selectedTaskTypes={selectedTaskTypes}
          onTaskTypesChange={setSelectedTaskTypes}
          showAllTasksCompleted={showAllTasksCompleted}
          onShowAllTasksCompletedChange={setShowAllTasksCompleted}
        />
      </div>

      {/* Open Tasks Tally Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ClipboardList className="h-6 w-6 text-primary" />
            Open Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-primary">{totalOpenTasks}</div>
          <p className="text-muted-foreground mt-2">
            {totalOpenTasks === 0 ? 'All tasks completed!' : `${totalOpenTasks === 1 ? 'task' : 'tasks'} pending across ${tasksByCase.size} ${tasksByCase.size === 1 ? 'case' : 'cases'}`}
          </p>
        </CardContent>
      </Card>

      {/* Open Tasks List - Responsive Grid */}
      {totalOpenTasks > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Task Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(tasksByCase.entries()).map(([caseId, tasks]) => {
              const firstTask = tasks[0];
              // Find the full case to get arrival date
              const fullCase = filteredCases.find(c => c.id.toString() === caseId);
              
              return (
                <Card 
                  key={caseId} 
                  className="bg-white dark:bg-card cursor-pointer transition-all hover:shadow-md hover:bg-blue-50 group"
                  onClick={() => onNavigateToCase(firstTask.caseId)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg text-primary group-hover:text-primary/80 transition-colors">
                            {firstTask.petName}
                          </CardTitle>
                          <Badge 
                            variant="outline" 
                            className={cn('rounded-full px-2 py-0.5 text-xs font-medium', getSpeciesBadgeClass(firstTask.species))}
                          >
                            {getSpeciesLabel(firstTask.species)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center justify-between">
                            <span>MRN: {firstTask.medicalRecordNumber}</span>
                            {fullCase && fullCase.arrivalDate && fullCase.arrivalDate > 0n && (
                              <span className="text-xs font-medium text-foreground/70">
                                {formatArrivalDate(fullCase.arrivalDate)}
                              </span>
                            )}
                          </div>
                          <div>Owner: {firstTask.ownerLastName}</div>
                          {firstTask.presentingComplaint && (
                            <div className="text-foreground/80 font-medium">
                              {firstTask.presentingComplaint}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="ml-2">
                          {tasks.length}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {tasks.map((task) => {
                        // Find the checklist item to get the color
                        const checklistItem = CHECKLIST_ITEMS.find(item => item.label === task.taskLabel);
                        const color = checklistItem?.color || 'gray';
                        const borderColor = getTaskBorderColor(color);
                        const backgroundColor = getTaskBackgroundColor(color);
                        const IconComponent = TASK_ICONS[task.taskLabel] || CheckCircle2;
                        
                        return (
                          <div
                            key={`${task.caseId}-${task.taskType}`}
                            className={cn(
                              'flex items-center justify-center p-2 rounded-md border-2',
                              borderColor,
                              backgroundColor
                            )}
                            title={task.taskLabel}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="bg-white dark:bg-card">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              {debouncedSearch.trim() || selectedTaskTypes.size > 0 || showAllTasksCompleted
                ? 'No open tasks match your search or filters.'
                : 'There are no open tasks at the moment. Great work! 🎉'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
