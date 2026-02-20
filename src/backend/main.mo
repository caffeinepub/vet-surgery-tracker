import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
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

  module SurgeryCase {
    public func compare(a : SurgeryCase, b : SurgeryCase) : Order.Order {
      Text.compare(a.medicalRecordNumber, b.medicalRecordNumber);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  public type OpenAIConfig = {
    apiKey : Text;
    initialized : Bool;
  };

  var openAIConfig : ?OpenAIConfig = ?{
    apiKey = "";
    initialized = false;
  };

  var nextId = 0;
  let cases = Map.empty<Nat, SurgeryCase>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    checkUserPermission(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user) { checkAdminPermission(caller) };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    checkUserPermission(caller);
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createCase(
    medicalRecordNumber : Text,
    arrivalDate : Time.Time,
    petName : Text,
    ownerLastName : Text,
    species : Species,
    breed : Text,
    sex : Sex,
    dateOfBirth : ?Time.Time,
    presentingComplaint : Text,
    notes : Text,
    checklist : Checklist,
  ) : async SurgeryCase {
    checkUserPermission(caller);

    let newCase : SurgeryCase = {
      id = nextId;
      medicalRecordNumber;
      arrivalDate;
      petName;
      ownerLastName;
      species;
      breed;
      sex;
      dateOfBirth;
      presentingComplaint;
      notes;
      checklist;
    };

    cases.add(nextId, newCase);
    nextId += 1;
    newCase;
  };

  public query ({ caller }) func getAllCases() : async [SurgeryCase] {
    checkUserPermission(caller);
    cases.values().toArray().sort();
  };

  public query ({ caller }) func getCase(id : Nat) : async SurgeryCase {
    checkUserPermission(caller);
    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?surgeryCase) { surgeryCase };
    };
  };

  public query ({ caller }) func getCasesByOwner(ownerLastName : Text) : async [SurgeryCase] {
    checkUserPermission(caller);
    cases.values().toArray().filter(
      func(surgeryCase) { surgeryCase.ownerLastName == ownerLastName }
    ).sort();
  };

  public shared ({ caller }) func updateCase(
    id : Nat,
    medicalRecordNumber : Text,
    arrivalDate : Time.Time,
    petName : Text,
    ownerLastName : Text,
    species : Species,
    breed : Text,
    sex : Sex,
    dateOfBirth : ?Time.Time,
    presentingComplaint : Text,
    notes : Text,
    checklist : Checklist,
  ) : async () {
    checkUserPermission(caller);

    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?_) { () };
    };

    let updatedCase : SurgeryCase = {
      id;
      medicalRecordNumber;
      arrivalDate;
      petName;
      ownerLastName;
      species;
      breed;
      sex;
      dateOfBirth;
      presentingComplaint;
      notes;
      checklist;
    };

    cases.add(id, updatedCase);
  };

  public shared ({ caller }) func deleteCase(id : Nat) : async () {
    checkUserPermission(caller);

    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?_) { cases.remove(id) };
    };
  };

  public query ({ caller }) func getChecklist(id : Nat) : async Checklist {
    checkUserPermission(caller);
    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?surgeryCase) { surgeryCase.checklist };
    };
  };

  public shared ({ caller }) func updateChecklist(id : Nat, checklist : Checklist) : async () {
    checkUserPermission(caller);

    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?existingCase) {
        let updatedCase : SurgeryCase = {
          existingCase with
          checklist
        };
        cases.add(id, updatedCase);
      };
    };
  };

  public shared ({ caller }) func updateCaseNotes(id : Nat, notes : Text) : async () {
    checkUserPermission(caller);

    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?existingCase) {
        let updatedCase : SurgeryCase = {
          existingCase with
          notes
        };
        cases.add(id, updatedCase);
      };
    };
  };

  public query ({ caller }) func searchCasesByMedicalRecordNumber(searchTerm : Text) : async [SurgeryCase] {
    checkUserPermission(caller);
    cases.values().toArray().filter(
      func(surgeryCase) {
        surgeryCase.medicalRecordNumber.contains(#text searchTerm);
      }
    ).sort();
  };

  public query ({ caller }) func getCaseByMedicalRecordNumber(medicalRecordNumber : Text) : async ?SurgeryCase {
    checkUserPermission(caller);
    let caseEntry = cases.entries().find(
      func(id, surgeryCase) {
        surgeryCase.medicalRecordNumber == medicalRecordNumber;
      }
    );
    switch (caseEntry) {
      case (null) { null };
      case (?(_, surgeryCase)) { ?surgeryCase };
    };
  };

  public query ({ caller }) func isCaseCreationAllowed() : async Bool {
    checkUserPermission(caller);
    switch (openAIConfig) {
      case (null) { false };
      case (?config) { config.initialized };
    };
  };

  public shared ({ caller }) func setOpenAIConfig(apiKey : Text) : async () {
    checkAdminPermission(caller);
    if (apiKey.size() == 0) {
      Runtime.trap("API key cannot be empty");
    };
    openAIConfig := ?{
      apiKey;
      initialized = true;
    };
  };

  public query ({ caller }) func getOpenAIConfig() : async ?OpenAIConfig {
    checkAdminPermission(caller);
    openAIConfig;
  };

  func checkUserPermission(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access this functionality");
    };
  };

  func checkAdminPermission(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  public query ({ caller }) func validateOpenAIConfig() : async Bool {
    checkUserPermission(caller);

    switch (openAIConfig) {
      case (null) { false };
      case (?config) { config.apiKey.size() > 0 and config.initialized };
    };
  };
};
