import { useState } from 'react';
import type { SurgeryCase, TaskOptions, Sex } from '../../../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, Save } from 'lucide-react';
import { useUpdateCaseNotes, useDeleteCase, useUpdateTask, useUpdateRemainingTasks } from '../../../hooks/useQueries';
import { nanosecondsToDate } from '../validation';
import { toast } from 'sonner';
import { getRemainingChecklistItems, getCompletedTaskCount, getTotalSelectedTaskCount, CHECKLIST_ITEMS } from '../checklist';
import ChecklistEditor from './ChecklistEditor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CaseCardProps {
  surgeryCase: SurgeryCase;
  onEdit: (surgeryCase: SurgeryCase) => void;
}

function formatSexDisplay(sex: Sex): string {
  switch (sex) {
    case 'male':
      return 'Male';
    case 'maleNeutered':
      return 'Male Neutered';
    case 'female':
      return 'Female';
    case 'femaleSpayed':
      return 'Female Spayed';
    default:
      return sex;
  }
}

export default function CaseCard({ surgeryCase, onEdit }: CaseCardProps) {
  const [editedNotes, setEditedNotes] = useState(surgeryCase.notes);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingTasks, setIsEditingTasks] = useState(false);
  const [editedTask, setEditedTask] = useState(surgeryCase.task);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateNotes = useUpdateCaseNotes();
  const deleteCase = useDeleteCase();
  const updateTask = useUpdateTask();
  const updateRemainingTasks = useUpdateRemainingTasks();

  const handleSaveNotes = async () => {
    if (editedNotes === surgeryCase.notes) {
      setIsEditingNotes(false);
      return;
    }

    try {
      await updateNotes.mutateAsync({
        id: surgeryCase.id,
        notes: editedNotes,
      });
      toast.success('Notes updated');
      setIsEditingNotes(false);
    } catch (error) {
      console.error('[CaseCard] Error updating notes', { error });
      toast.error('Failed to update notes');
    }
  };

  const handleCancelEditNotes = () => {
    setEditedNotes(surgeryCase.notes);
    setIsEditingNotes(false);
  };

  const handleDelete = async () => {
    try {
      await deleteCase.mutateAsync(surgeryCase.id);
      toast.success('Case deleted');
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('[CaseCard] Error deleting case', { error });
      toast.error('Failed to delete case');
    }
  };

  const handleTaskChange = async (updatedTask: typeof surgeryCase.task) => {
    try {
      await updateTask.mutateAsync({
        id: surgeryCase.id,
        task: updatedTask,
      });
      toast.success('Task updated');
    } catch (error) {
      console.error('[CaseCard] Error updating task', { error });
      toast.error('Failed to update task');
    }
  };

  const handleEditTasks = () => {
    setEditedTask(surgeryCase.task);
    setIsEditingTasks(true);
  };

  const handleSaveTasks = async () => {
    // Convert Task to TaskOptions for the backend
    const taskOptions: TaskOptions = {
      dischargeNotes: editedTask.dischargeNotesSelected,
      pdvmNotified: editedTask.pdvmNotifiedSelected,
      labs: editedTask.labsSelected,
      histo: editedTask.histoSelected,
      surgeryReport: editedTask.surgeryReportSelected,
      imaging: editedTask.imagingSelected,
      culture: editedTask.cultureSelected,
    };

    try {
      await updateRemainingTasks.mutateAsync({
        id: surgeryCase.id,
        taskOptions,
      });
      toast.success('Tasks updated');
      setIsEditingTasks(false);
    } catch (error) {
      console.error('[CaseCard] Error updating tasks', { error });
      toast.error('Failed to update tasks');
    }
  };

  const handleCancelEditTasks = () => {
    setEditedTask(surgeryCase.task);
    setIsEditingTasks(false);
  };

  const arrivalDateFormatted = nanosecondsToDate(surgeryCase.arrivalDate).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  const dateOfBirthFormatted = surgeryCase.dateOfBirth
    ? nanosecondsToDate(surgeryCase.dateOfBirth).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      })
    : 'N/A';

  // Calculate age from date of birth
  const calculateAge = () => {
    if (!surgeryCase.dateOfBirth) return 'N/A';
    
    const birthDate = nanosecondsToDate(surgeryCase.dateOfBirth);
    const today = new Date();
    const ageInYears = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust if birthday hasn't occurred this year
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ? ageInYears - 1
      : ageInYears;
    
    if (adjustedAge < 1) {
      const ageInMonths = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      return ageInMonths === 1 ? '1 month' : `${ageInMonths} months`;
    }
    
    return adjustedAge === 1 ? '1 year' : `${adjustedAge} years`;
  };

  const age = calculateAge();

  // Check if notes should be displayed (not empty or whitespace only)
  const hasNotes = surgeryCase.notes && surgeryCase.notes.trim().length > 0;

  // Get remaining tasks
  const remainingItems = getRemainingChecklistItems(surgeryCase.task);
  const completedCount = getCompletedTaskCount(surgeryCase.task);
  const totalCount = getTotalSelectedTaskCount(surgeryCase.task);

  return (
    <>
      <Card className="bg-white dark:bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl text-primary">{surgeryCase.petName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                MRN: {surgeryCase.medicalRecordNumber} | Owner: {surgeryCase.ownerLastName}
              </p>
              {/* Species field without grey box wrapper */}
              <div className="mt-2">
                <Badge variant="secondary" className="rounded-full bg-[oklch(var(--species-bg))]">
                  {surgeryCase.species}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => onEdit(surgeryCase)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="font-medium">Breed:</span> {surgeryCase.breed}
            </div>
            <div>
              <span className="font-medium">Sex:</span> {formatSexDisplay(surgeryCase.sex)}
            </div>
            <div>
              <span className="font-medium">Age:</span> {age}
            </div>
            <div>
              <span className="font-medium">DOB:</span> {dateOfBirthFormatted}
            </div>
            <div>
              <span className="font-medium">Arrival:</span> {arrivalDateFormatted}
            </div>
          </div>

          {/* Presenting Complaint with orange border and orange background */}
          {surgeryCase.presentingComplaint && (
            <div className="rounded-lg border-2 border-[oklch(var(--complaint-border))] bg-[oklch(var(--complaint-bg))] p-3">
              <p className="text-sm font-medium text-foreground mb-1">Presenting Complaint</p>
              <p className="text-sm text-foreground">{surgeryCase.presentingComplaint}</p>
            </div>
          )}

          {/* Notes Section - Only visible if there are notes, with green border and background */}
          {hasNotes && (
            <div className="space-y-2 border-2 border-[oklch(var(--notes-border))] bg-[oklch(var(--notes-bg))] rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Notes</p>
                {!isEditingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingNotes(true)}
                    className="h-7 px-2"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              {isEditingNotes ? (
                <>
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add notes..."
                    className="min-h-[100px] bg-white border-[oklch(var(--notes-border))]"
                    disabled={updateNotes.isPending}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEditNotes}
                      disabled={updateNotes.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={updateNotes.isPending}
                    >
                      {updateNotes.isPending ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap">{surgeryCase.notes}</p>
              )}
            </div>
          )}

          {/* Remaining Tasks Section - Moved below notes */}
          {totalCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Remaining Tasks ({completedCount}/{totalCount})
                </p>
                {!isEditingTasks && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditTasks}
                    className="h-7 px-2"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit Tasks
                  </Button>
                )}
              </div>
              {isEditingTasks ? (
                <>
                  <ChecklistEditor
                    task={editedTask}
                    onChange={setEditedTask}
                    disabled={updateRemainingTasks.isPending}
                    mode="creation"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEditTasks}
                      disabled={updateRemainingTasks.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveTasks}
                      disabled={updateRemainingTasks.isPending}
                    >
                      {updateRemainingTasks.isPending ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : remainingItems.length > 0 ? (
                <ChecklistEditor
                  task={surgeryCase.task}
                  onChange={handleTaskChange}
                  disabled={updateTask.isPending}
                  mode="completion"
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">All tasks completed! 🎉</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the case for {surgeryCase.petName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
