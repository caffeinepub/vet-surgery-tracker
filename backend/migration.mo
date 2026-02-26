import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

module {
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

    followUpSelected : Bool;
    followUpCompleted : Bool;
  };

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
  };

  type SurgeryCase = {
    id : Nat;
    medicalRecordNumber : Text;
    arrivalDate : Time.Time;
    petName : Text;
    ownerLastName : Text;
    species : { #canine; #feline; #other };
    breed : Text;
    sex : { #male; #maleNeutered; #female; #femaleSpayed };
    dateOfBirth : ?Time.Time;
    presentingComplaint : Text;
    notes : Text;
    task : Task;
  };

  type OldSurgeryCase = {
    id : Nat;
    medicalRecordNumber : Text;
    arrivalDate : Time.Time;
    petName : Text;
    ownerLastName : Text;
    species : { #canine; #feline; #other };
    breed : Text;
    sex : { #male; #maleNeutered; #female; #femaleSpayed };
    dateOfBirth : ?Time.Time;
    presentingComplaint : Text;
    notes : Text;
    task : OldTask;
  };

  type OldActor = {
    cases : Map.Map<Nat, OldSurgeryCase>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    openAIConfig : ?{ apiKey : Text; initialized : Bool };
    nextId : Nat;
    accessControlState : AccessControl.AccessControlState;
  };

  type NewActor = {
    cases : Map.Map<Nat, SurgeryCase>;
    userProfiles : Map.Map<Principal, { name : Text }>;
    openAIConfig : ?{ apiKey : Text; initialized : Bool };
    nextId : Nat;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor {
    let newCases = old.cases.map<Nat, OldSurgeryCase, SurgeryCase>(
      func(_id, oldSurgeryCase) {
        {
          oldSurgeryCase with
          task = {
            oldSurgeryCase.task with
            followUpSelected = false;
            followUpCompleted = false;
          };
        };
      }
    );
    {
      old with
      cases = newCases;
    };
  };
};
