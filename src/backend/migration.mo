import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type Checklist = {
    dischargeNotes : Bool;
    pdvmNotified : Bool;
    labs : Bool;
    histo : Bool;
    surgeryReport : Bool;
    imaging : Bool;
    culture : Bool;
  };

  type CompletedTasks = {
    dischargeNotes : Bool;
    pdvmNotified : Bool;
    labs : Bool;
    histo : Bool;
    surgeryReport : Bool;
    imaging : Bool;
    culture : Bool;
  };

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
    completedTasks : CompletedTasks;
  };

  type Task = {
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
  };

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
    task : Task;
  };

  type OldActor = {
    nextId : Nat;
    cases : Map.Map<Nat, OldSurgeryCase>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    openAIConfig : ?{
      apiKey : Text;
      initialized : Bool;
    };
  };

  type NewActor = {
    nextId : Nat;
    cases : Map.Map<Nat, NewSurgeryCase>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    openAIConfig : ?{
      apiKey : Text;
      initialized : Bool;
    };
  };

  public func run(old : OldActor) : NewActor {
    let newCases = old.cases.map<Nat, OldSurgeryCase, NewSurgeryCase>(
      func(_id, oldCase) {
        let task = {
          dischargeNotesSelected = true;
          dischargeNotesCompleted = oldCase.completedTasks.dischargeNotes;

          pdvmNotifiedSelected = true;
          pdvmNotifiedCompleted = oldCase.completedTasks.pdvmNotified;

          labsSelected = true;
          labsCompleted = oldCase.completedTasks.labs;

          histoSelected = true;
          histoCompleted = oldCase.completedTasks.histo;

          surgeryReportSelected = true;
          surgeryReportCompleted = oldCase.completedTasks.surgeryReport;

          imagingSelected = true;
          imagingCompleted = oldCase.completedTasks.imaging;

          cultureSelected = true;
          cultureCompleted = oldCase.completedTasks.culture;
        };

        {
          oldCase with
          task;
        };
      }
    );

    {
      old with
      cases = newCases;
    };
  };
};
