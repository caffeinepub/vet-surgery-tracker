import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";


import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Specify the data migration function in with-clause.

actor {
  public type Species = { #canine; #feline; #other };
  public type Sex = { #male; #maleNeutered; #female; #femaleSpayed };

  public type Task = {
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

    dailySummarySelected : Bool; // New field
    dailySummaryCompleted : Bool; // New field
  };

  public type TaskType = {
    #dischargeNotes;
    #pdvmNotified;
    #labs;
    #histo;
    #surgeryReport;
    #imaging;
    #culture;
    #followUp;
    #dailySummary; // New task type
  };

  public type TaskOptions = {
    dischargeNotes : Bool;
    pdvmNotified : Bool;
    labs : Bool;
    histo : Bool;
    surgeryReport : Bool;
    imaging : Bool;
    culture : Bool;
    followUp : Bool;
    dailySummary : Bool; // New option for selection dialog
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
    task : Task;
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

  public type Dashboard = {
    openTasks : Nat;
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
    taskOptions : TaskOptions, // Now includes dailySummary
  ) : async SurgeryCase {
    checkUserPermission(caller);

    let newTask : Task = {
      dischargeNotesSelected = taskOptions.dischargeNotes;
      dischargeNotesCompleted = false;

      pdvmNotifiedSelected = taskOptions.pdvmNotified;
      pdvmNotifiedCompleted = false;

      labsSelected = taskOptions.labs;
      labsCompleted = false;

      histoSelected = taskOptions.histo;
      histoCompleted = false;

      surgeryReportSelected = taskOptions.surgeryReport;
      surgeryReportCompleted = false;

      imagingSelected = taskOptions.imaging;
      imagingCompleted = false;

      cultureSelected = taskOptions.culture;
      cultureCompleted = false;

      followUpSelected = taskOptions.followUp;
      followUpCompleted = false;

      dailySummarySelected = taskOptions.dailySummary;
      dailySummaryCompleted = false;
    };

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
      task = newTask;
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
    task : Task,
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
      task;
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

  public query ({ caller }) func getTask(id : Nat) : async Task {
    checkUserPermission(caller);
    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?surgeryCase) { surgeryCase.task };
    };
  };

  public shared ({ caller }) func updateTask(id : Nat, task : Task) : async () {
    checkUserPermission(caller);

    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?existingCase) {
        let updatedCase : SurgeryCase = {
          existingCase with
          task
        };
        cases.add(id, updatedCase);
      };
    };
  };

  public shared ({ caller }) func updateTaskCompletion(id : Nat, taskType : TaskType) : async () {
    checkUserPermission(caller);

    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?existingCase) {
        let updatedTask = updateTaskCompletionState(existingCase.task, taskType);
        let updatedCase : SurgeryCase = {
          existingCase with
          task = updatedTask;
        };
        cases.add(id, updatedCase);
      };
    };
  };

  func updateTaskCompletionState(task : Task, taskType : TaskType) : Task {
    switch (taskType) {
      case (#dischargeNotes) {
        {
          task with
          dischargeNotesCompleted = not task.dischargeNotesCompleted;
        };
      };
      case (#pdvmNotified) {
        {
          task with
          pdvmNotifiedCompleted = not task.pdvmNotifiedCompleted;
        };
      };
      case (#labs) { { task with labsCompleted = not task.labsCompleted } };
      case (#histo) { { task with histoCompleted = not task.histoCompleted } };
      case (#surgeryReport) {
        {
          task with
          surgeryReportCompleted = not task.surgeryReportCompleted;
        };
      };
      case (#imaging) {
        {
          task with
          imagingCompleted = not task.imagingCompleted;
        };
      };
      case (#culture) {
        {
          task with
          cultureCompleted = not task.cultureCompleted;
        };
      };
      case (#followUp) {
        {
          task with
          followUpCompleted = not task.followUpCompleted;
        };
      };
      case (#dailySummary) {
        {
          task with
          dailySummaryCompleted = not task.dailySummaryCompleted;
        };
      };
    };
  };

  public shared ({ caller }) func updateRemainingTasks(id : Nat, taskOptions : TaskOptions) : async () {
    checkUserPermission(caller);

    switch (cases.get(id)) {
      case (null) { Runtime.trap("Case not found") };
      case (?existingCase) {
        let updatedTask : Task = {
          dischargeNotesSelected = taskOptions.dischargeNotes;
          dischargeNotesCompleted = false;

          pdvmNotifiedSelected = taskOptions.pdvmNotified;
          pdvmNotifiedCompleted = false;

          labsSelected = taskOptions.labs;
          labsCompleted = false;

          histoSelected = taskOptions.histo;
          histoCompleted = false;

          surgeryReportSelected = taskOptions.surgeryReport;
          surgeryReportCompleted = false;

          imagingSelected = taskOptions.imaging;
          imagingCompleted = false;

          cultureSelected = taskOptions.culture;
          cultureCompleted = false;

          followUpSelected = taskOptions.followUp;
          followUpCompleted = false;

          dailySummarySelected = taskOptions.dailySummary;
          dailySummaryCompleted = false;
        };
        let updatedCase : SurgeryCase = {
          existingCase with
          task = updatedTask;
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

  public query ({ caller }) func getDashboard() : async Dashboard {
    checkUserPermission(caller);
    var taskCount = 0;

    for (caseMap in cases.values()) {
      if (caseMap.task.dischargeNotesSelected and not caseMap.task.dischargeNotesCompleted) {
        taskCount += 1;
      };
      if (caseMap.task.pdvmNotifiedSelected and not caseMap.task.pdvmNotifiedCompleted) {
        taskCount += 1;
      };
      if (caseMap.task.labsSelected and not caseMap.task.labsCompleted) {
        taskCount += 1;
      };
      if (caseMap.task.histoSelected and not caseMap.task.histoCompleted) {
        taskCount += 1;
      };
      if (caseMap.task.surgeryReportSelected and not caseMap.task.surgeryReportCompleted) {
        taskCount += 1;
      };
      if (caseMap.task.imagingSelected and not caseMap.task.imagingCompleted) {
        taskCount += 1;
      };
      if (caseMap.task.cultureSelected and not caseMap.task.cultureCompleted) {
        taskCount += 1;
      };
      if (caseMap.task.followUpSelected and not caseMap.task.followUpCompleted) {
        taskCount += 1;
      };
      if (caseMap.task.dailySummarySelected and not caseMap.task.dailySummaryCompleted) {
        taskCount += 1;
      };
    };

    { openTasks = taskCount };
  };
};

