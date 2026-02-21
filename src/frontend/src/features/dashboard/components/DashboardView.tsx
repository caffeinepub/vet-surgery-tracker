import { useGetAllCases } from '../../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle2, ChevronRight } from 'lucide-react';
import { getOpenTasksFromCase, getTotalOpenTasksCount } from '../utils/openTasksCalculation';
import { CHECKLIST_ITEMS, getTaskBorderColor, getTaskBackgroundColor } from '../../cases/checklist';

interface DashboardViewProps {
  onNavigateToCase: (caseId: bigint) => void;
}

export default function DashboardView({ onNavigateToCase }: DashboardViewProps) {
  const { data: cases = [], isLoading } = useGetAllCases();

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

  const totalOpenTasks = getTotalOpenTasksCount(cases);
  const allOpenTasks = cases.flatMap(getOpenTasksFromCase);

  // Group tasks by case for better display
  const tasksByCase = new Map<string, typeof allOpenTasks>();
  for (const task of allOpenTasks) {
    const key = task.caseId.toString();
    if (!tasksByCase.has(key)) {
      tasksByCase.set(key, []);
    }
    tasksByCase.get(key)!.push(task);
  }

  return (
    <div className="space-y-6">
      {/* Header with tally */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overview of all open tasks</p>
        </div>
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

      {/* Open Tasks List */}
      {totalOpenTasks > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Task Details</h3>
          <div className="grid gap-4">
            {Array.from(tasksByCase.entries()).map(([caseId, tasks]) => {
              const firstTask = tasks[0];
              return (
                <Card 
                  key={caseId} 
                  className="bg-white dark:bg-card cursor-pointer transition-all hover:shadow-md hover:bg-blue-50 group"
                  onClick={() => onNavigateToCase(firstTask.caseId)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-primary group-hover:text-primary/80 transition-colors">
                          {firstTask.petName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          MRN: {firstTask.medicalRecordNumber} | Owner: {firstTask.ownerLastName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="ml-2">
                          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tasks.map((task) => {
                        // Find the checklist item to get the color
                        const checklistItem = CHECKLIST_ITEMS.find(item => item.label === task.taskLabel);
                        const color = checklistItem?.color || 'gray';
                        const borderColor = getTaskBorderColor(color);
                        const backgroundColor = getTaskBackgroundColor(color);
                        
                        return (
                          <div
                            key={`${task.caseId}-${task.taskType}`}
                            className={cn(
                              'flex items-center gap-2 text-sm p-2 rounded-md border-2',
                              borderColor,
                              backgroundColor
                            )}
                          >
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{task.taskLabel}</span>
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
              There are no open tasks at the moment. Great work! 🎉
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
