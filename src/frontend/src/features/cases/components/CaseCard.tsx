import { useState } from 'react';
import type { SurgeryCase } from '../../../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, FileText } from 'lucide-react';
import { useUpdateTask, useUpdateCaseNotes, useDeleteCase } from '../../../hooks/useQueries';
import { getRemainingChecklistItems, getCompletedTaskCount, getTotalSelectedTaskCount } from '../checklist';
import { nanosecondsToDate } from '../validation';
import { toast } from 'sonner';
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

export default function CaseCard({ surgeryCase, onEdit }: CaseCardProps) {
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [editedNotes, setEditedNotes] = useState(surgeryCase.notes);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateTask = useUpdateTask();
  const updateNotes = useUpdateCaseNotes();
  const deleteCase = useDeleteCase();

  const remainingItems = getRemainingChecklistItems(surgeryCase.task);
  const completedCount = getCompletedTaskCount(surgeryCase.task);
  const totalSelectedCount = getTotalSelectedTaskCount(surgeryCase.task);

  const handleTaskToggle = async (completedField: keyof typeof surgeryCase.task) => {
    const currentValue = surgeryCase.task[completedField];
    const updatedTask = {
      ...surgeryCase.task,
      [completedField]: !currentValue,
    };

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

  const handleSaveNotes = async () => {
    if (editedNotes === surgeryCase.notes) {
      setIsNotesExpanded(false);
      return;
    }

    try {
      await updateNotes.mutateAsync({
        id: surgeryCase.id,
        notes: editedNotes,
      });
      toast.success('Notes updated');
      setIsNotesExpanded(false);
    } catch (error) {
      console.error('[CaseCard] Error updating notes', { error });
      toast.error('Failed to update notes');
    }
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
              <span className="font-medium">Species:</span> {surgeryCase.species}
            </div>
            <div>
              <span className="font-medium">Breed:</span> {surgeryCase.breed}
            </div>
            <div>
              <span className="font-medium">Sex:</span> {surgeryCase.sex}
            </div>
            <div>
              <span className="font-medium">DOB:</span> {dateOfBirthFormatted}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Arrival:</span> {arrivalDateFormatted}
            </div>
          </div>

          {/* Presenting Complaint */}
          {surgeryCase.presentingComplaint && (
            <div className="rounded-lg bg-complaint p-3 border border-complaint-border">
              <p className="text-sm font-medium text-complaint-foreground mb-1">Presenting Complaint</p>
              <p className="text-sm text-foreground">{surgeryCase.presentingComplaint}</p>
            </div>
          )}

          {/* Remaining Tasks */}
          {totalSelectedCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Remaining Tasks</p>
                <Badge variant={remainingItems.length === 0 ? 'default' : 'secondary'}>
                  {completedCount}/{totalSelectedCount}
                </Badge>
              </div>
              {remainingItems.length > 0 ? (
                <div className="space-y-2 pl-1">
                  {remainingItems.map((item) => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`task-${surgeryCase.id}-${item.key}`}
                        checked={false}
                        onCheckedChange={() => handleTaskToggle(item.completedField)}
                        disabled={updateTask.isPending}
                      />
                      <Label
                        htmlFor={`task-${surgeryCase.id}-${item.key}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">All tasks completed! 🎉</p>
              )}
            </div>
          )}

          {/* Notes Section */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className="w-full justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isNotesExpanded ? 'Hide Notes' : 'Show Notes'}
            </Button>

            {isNotesExpanded && (
              <div className="space-y-2">
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="min-h-[100px]"
                  disabled={updateNotes.isPending}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditedNotes(surgeryCase.notes);
                      setIsNotesExpanded(false);
                    }}
                    disabled={updateNotes.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={updateNotes.isPending || editedNotes === surgeryCase.notes}
                  >
                    {updateNotes.isPending ? 'Saving...' : 'Save Notes'}
                  </Button>
                </div>
              </div>
            )}
          </div>
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
