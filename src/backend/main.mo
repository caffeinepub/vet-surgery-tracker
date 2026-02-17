import Array "mo:core/Array";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

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

  module Checklist {
    public func default() : Checklist {
      {
        dischargeNotes = true;
        pdvmNotified = true;
        labs = false;
        histo = false;
        surgeryReport = false;
        imaging = false;
        culture = false;
      };
    };
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

  var nextId = 0;
  let cases = Map.empty<Nat, SurgeryCase>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createCase(
    medicalRecordNumber : Text,
    petName : Text,
    ownerLastName : Text,
    species : Species,
    breed : Text,
    sex : Sex,
    dateOfBirth : ?Time.Time,
    presentingComplaint : Text,
    notes : Text,
  ) : async SurgeryCase {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create cases");
    };

    let newCase : SurgeryCase = {
      id = nextId;
      medicalRecordNumber;
      arrivalDate = Time.now();
      petName;
      ownerLastName;
      species;
      breed;
      sex;
      dateOfBirth;
      presentingComplaint;
      notes;
      checklist = Checklist.default();
    };

    cases.add(nextId, newCase);
    nextId += 1;
    newCase;
  };

  public query ({ caller }) func getAllCases() : async [SurgeryCase] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };
    cases.values().toArray().sort();
  };

  public query ({ caller }) func getCase(id : Nat) : async SurgeryCase {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };
    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?surgeryCase) { surgeryCase };
    };
  };

  public query ({ caller }) func getCasesByOwner(ownerLastName : Text) : async [SurgeryCase] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };
    cases.values().toArray().filter(
      func(surgeryCase) { surgeryCase.ownerLastName == ownerLastName }
    ).sort();
  };

  public shared ({ caller }) func updateCase(
    id : Nat,
    medicalRecordNumber : Text,
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cases");
    };

    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?_) { () };
    };

    let updatedCase : SurgeryCase = {
      id;
      medicalRecordNumber;
      arrivalDate = Time.now();
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete cases");
    };

    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?_) { cases.remove(id) };
    };
  };

  public query ({ caller }) func getChecklist(id : Nat) : async Checklist {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view checklists");
    };
    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?surgeryCase) { surgeryCase.checklist };
    };
  };

  public shared ({ caller }) func updateChecklist(id : Nat, checklist : Checklist) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update checklists");
    };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update notes");
    };

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
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can search cases");
    };
    cases.values().toArray().filter(
      func(surgeryCase) {
        surgeryCase.medicalRecordNumber.contains(#text searchTerm);
      }
    ).sort();
  };
};
