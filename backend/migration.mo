import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  // Original task type.
  type OldTask = {
    dischargeNotesSelected : Bool;
    dischargeNotesCompleted : Bool;

    pdvmNotifiedSelected : Bool;
    pdvmNotifiedCompleted : Bool;

    labsSelected : Bool;
    labsCompleted : Bool;

    histoSelected : Bool;
    histoCompleted : Bool;

    surgeryReportSelected : Bool;
    surgeryReportCompleted : Bool;

    imagingSelected : Bool;
    imagingCompleted : Bool;

    cultureSelected : Bool;
    cultureCompleted : Bool;

    followUpSelected : Bool;
    followUpCompleted : Bool;
  };

  // Original surgery case type
  type OldSurgeryCase = {
    id : Nat;
    medicalRecordNumber : Text;
    arrivalDate : Int;
    petName : Text;
    ownerLastName : Text;
    species : {
      #canine;
      #feline;
      #other;
    };
    breed : Text;
    sex : {
      #male;
      #maleNeutered;
      #female;
      #femaleSpayed;
    };
    dateOfBirth : ?Int;
    presentingComplaint : Text;
    notes : Text;
    task : OldTask;
  };

  // Original actor type
  type OldActor = {
    cases : Map.Map<Nat, OldSurgeryCase>;
  };

  // New extended task type.
  type NewTask = {
    dischargeNotesSelected : Bool;
    dischargeNotesCompleted : Bool;

    pdvmNotifiedSelected : Bool;
    pdvmNotifiedCompleted : Bool;

    labsSelected : Bool;
    labsCompleted : Bool;

    histoSelected : Bool;
    histoCompleted : Bool;

    surgeryReportSelected : Bool;
    surgeryReportCompleted : Bool;

    imagingSelected : Bool;
    imagingCompleted : Bool;

    cultureSelected : Bool;
    cultureCompleted : Bool;

    followUpSelected : Bool;
    followUpCompleted : Bool;

    dailySummarySelected : Bool;
    dailySummaryCompleted : Bool;
  };

  // New surgery case type
  type NewSurgeryCase = {
    id : Nat;
    medicalRecordNumber : Text;
    arrivalDate : Int;
    petName : Text;
    ownerLastName : Text;
    species : {
      #canine;
      #feline;
      #other;
    };
    breed : Text;
    sex : {
      #male;
      #maleNeutered;
      #female;
      #femaleSpayed;
    };
    dateOfBirth : ?Int;
    presentingComplaint : Text;
    notes : Text;
    task : NewTask;
  };

  // New actor type
  type NewActor = {
    cases : Map.Map<Nat, NewSurgeryCase>;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    let newCases = old.cases.map<Nat, OldSurgeryCase, NewSurgeryCase>(
      func(_id, oldCase) {
        {
          oldCase with
          task = {
            oldCase.task with
            dailySummarySelected = false; // Default old data with false.
            dailySummaryCompleted = false; // Default old data with false.
          };
        };
      }
    );
    { old with cases = newCases };
  };
};
