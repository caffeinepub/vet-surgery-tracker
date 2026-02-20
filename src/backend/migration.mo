import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";

module {
  type OldOpenAIConfig = {
    apiKey : Text;
  };

  type OldActor = {
    cases : Map.Map<Nat, SurgeryCase>;
    nextId : Nat;
    openAIConfig : ?OldOpenAIConfig;
  };

  public type Species = { #canine; #feline; #other };
  public type Sex = { #male; #maleNeutered; #female; #femaleSpayed };

  public type Checklist = {
    dischargeNotes : Bool;
    pdvmNotified : Bool;
    labs : Bool;
    histo : Bool;
    surgeryReport : Bool;
    imaging : Bool;
    culture : Bool;
  };

  public type SurgeryCase = {
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
    checklist : Checklist;
  };

  type NewOpenAIConfig = {
    apiKey : Text;
    initialized : Bool;
  };

  type NewActor = {
    cases : Map.Map<Nat, SurgeryCase>;
    nextId : Nat;
    openAIConfig : ?NewOpenAIConfig;
  };

  public func run(old : OldActor) : NewActor {
    let newOpenAIConfig = switch (old.openAIConfig) {
      case (null) { null };
      case (?oldConfig) {
        ?{
          apiKey = oldConfig.apiKey;
          initialized = true;
        };
      };
    };
    {
      cases = old.cases;
      nextId = old.nextId;
      openAIConfig = newOpenAIConfig;
    };
  };
};
