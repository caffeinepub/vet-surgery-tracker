import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface OpenAIConfig {
    initialized: boolean;
    apiKey: string;
}
export interface TaskOptions {
    pdvmNotified: boolean;
    histo: boolean;
    labs: boolean;
    culture: boolean;
    followUp: boolean;
    surgeryReport: boolean;
    imaging: boolean;
    dischargeNotes: boolean;
}
export interface Task {
    cultureCompleted: boolean;
    cultureSelected: boolean;
    pdvmNotifiedCompleted: boolean;
    followUpCompleted: boolean;
    histoSelected: boolean;
    labsSelected: boolean;
    followUpSelected: boolean;
    imagingCompleted: boolean;
    surgeryReportCompleted: boolean;
    imagingSelected: boolean;
    dischargeNotesCompleted: boolean;
    surgeryReportSelected: boolean;
    dischargeNotesSelected: boolean;
    histoCompleted: boolean;
    pdvmNotifiedSelected: boolean;
    labsCompleted: boolean;
}
export interface SurgeryCase {
    id: bigint;
    sex: Sex;
    arrivalDate: Time;
    presentingComplaint: string;
    dateOfBirth?: Time;
    task: Task;
    medicalRecordNumber: string;
    petName: string;
    notes: string;
    ownerLastName: string;
    breed: string;
    species: Species;
}
export interface UserProfile {
    name: string;
}
export interface Dashboard {
    openTasks: bigint;
}
export enum Sex {
    female = "female",
    male = "male",
    femaleSpayed = "femaleSpayed",
    maleNeutered = "maleNeutered"
}
export enum Species {
    other = "other",
    feline = "feline",
    canine = "canine"
}
export enum TaskType {
    pdvmNotified = "pdvmNotified",
    histo = "histo",
    labs = "labs",
    culture = "culture",
    followUp = "followUp",
    surgeryReport = "surgeryReport",
    imaging = "imaging",
    dischargeNotes = "dischargeNotes"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCase(medicalRecordNumber: string, arrivalDate: Time, petName: string, ownerLastName: string, species: Species, breed: string, sex: Sex, dateOfBirth: Time | null, presentingComplaint: string, notes: string, taskOptions: TaskOptions): Promise<SurgeryCase>;
    deleteCase(id: bigint): Promise<void>;
    getAllCases(): Promise<Array<SurgeryCase>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCase(id: bigint): Promise<SurgeryCase>;
    getCaseByMedicalRecordNumber(medicalRecordNumber: string): Promise<SurgeryCase | null>;
    getCasesByOwner(ownerLastName: string): Promise<Array<SurgeryCase>>;
    getDashboard(): Promise<Dashboard>;
    getOpenAIConfig(): Promise<OpenAIConfig | null>;
    getTask(id: bigint): Promise<Task>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCaseCreationAllowed(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchCasesByMedicalRecordNumber(searchTerm: string): Promise<Array<SurgeryCase>>;
    setOpenAIConfig(apiKey: string): Promise<void>;
    updateCase(id: bigint, medicalRecordNumber: string, arrivalDate: Time, petName: string, ownerLastName: string, species: Species, breed: string, sex: Sex, dateOfBirth: Time | null, presentingComplaint: string, notes: string, task: Task): Promise<void>;
    updateCaseNotes(id: bigint, notes: string): Promise<void>;
    updateRemainingTasks(id: bigint, taskOptions: TaskOptions): Promise<void>;
    updateTask(id: bigint, task: Task): Promise<void>;
    updateTaskCompletion(id: bigint, taskType: TaskType): Promise<void>;
    validateOpenAIConfig(): Promise<boolean>;
}
