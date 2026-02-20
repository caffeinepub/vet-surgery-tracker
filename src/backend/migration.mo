import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type Species = { #canine; #feline; #other };
  type Sex = { #male; #maleNeutered; #female; #femaleSpayed };

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

  type SurgeryCase = {
    id : Nat;
    medicalRecordNumber : Text;
    arrivalDate : Time.Time;
    petName : Text;
    ownerLastName : Text;
    species : Species;
    breed : Text;
    sex : Sex;
    dateOfBirth : ?Time.Time;
    presentingComplaint : Text;
    notes : Text;
    task : Task;
  };

  type UserProfile = {
    name : Text;
  };

  type OpenAIConfig = {
    apiKey : Text;
    initialized : Bool;
  };

  public type OldActor = {
    openAIConfig : ?OpenAIConfig;
    nextId : Nat;
    cases : Map.Map<Nat, SurgeryCase>;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  public type NewActor = OldActor;

  public func run(old : OldActor) : NewActor {
    old;
  };
};
