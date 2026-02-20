import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type OldChecklist = {
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
    species : { #canine; #feline; #other };
    breed : Text;
    sex : { #male; #maleNeutered; #female; #femaleSpayed };
    dateOfBirth : ?Int;
    presentingComplaint : Text;
    notes : Text;
    checklist : OldChecklist;
  };

  type OldActor = {
    cases : Map.Map<Nat, OldSurgeryCase>;
  };

  type NewCompletedTasks = {
    dischargeNotes : Bool;
    pdvmNotified : Bool;
    labs : Bool;
    histo : Bool;
    surgeryReport : Bool;
    imaging : Bool;
    culture : Bool;
  };

  type NewSurgeryCase = {
    id : Nat;
    medicalRecordNumber : Text;
    arrivalDate : Int;
    petName : Text;
    ownerLastName : Text;
    species : { #canine; #feline; #other };
    breed : Text;
    sex : { #male; #maleNeutered; #female; #femaleSpayed };
    dateOfBirth : ?Int;
    presentingComplaint : Text;
    notes : Text;
    completedTasks : NewCompletedTasks;
  };

  type NewActor = {
    cases : Map.Map<Nat, NewSurgeryCase>;
  };

  public func run(old : OldActor) : NewActor {
    let newCases = old.cases.map<Nat, OldSurgeryCase, NewSurgeryCase>(
      func(_id, oldCase) {
        { oldCase with completedTasks = oldCase.checklist };
      }
    );
    { cases = newCases };
  };
};
