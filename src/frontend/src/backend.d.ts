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
export interface SurgeryCase {
    id: bigint;
    sex: Sex;
    arrivalDate: Time;
    presentingComplaint: string;
    dateOfBirth?: Time;
    medicalRecordNumber: string;
    petName: string;
    notes: string;
    checklist: Checklist;
    ownerLastName: string;
    breed: string;
    species: Species;
}
export interface Checklist {
    pdvmNotified: boolean;
    histo: boolean;
    labs: boolean;
    culture: boolean;
    surgeryReport: boolean;
    imaging: boolean;
    dischargeNotes: boolean;
}
export interface UserProfile {
    name: string;
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
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCase(medicalRecordNumber: string, arrivalDate: Time, petName: string, ownerLastName: string, species: Species, breed: string, sex: Sex, dateOfBirth: Time | null, presentingComplaint: string, notes: string, checklist: Checklist): Promise<SurgeryCase>;
    deleteCase(id: bigint): Promise<void>;
    getAllCases(): Promise<Array<SurgeryCase>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCase(id: bigint): Promise<SurgeryCase>;
    getCaseByMedicalRecordNumber(medicalRecordNumber: string): Promise<SurgeryCase | null>;
    getCasesByOwner(ownerLastName: string): Promise<Array<SurgeryCase>>;
    getChecklist(id: bigint): Promise<Checklist>;
    getOpenAIConfig(): Promise<OpenAIConfig | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCaseCreationAllowed(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchCasesByMedicalRecordNumber(searchTerm: string): Promise<Array<SurgeryCase>>;
    setOpenAIConfig(apiKey: string): Promise<void>;
    updateCase(id: bigint, medicalRecordNumber: string, arrivalDate: Time, petName: string, ownerLastName: string, species: Species, breed: string, sex: Sex, dateOfBirth: Time | null, presentingComplaint: string, notes: string, checklist: Checklist): Promise<void>;
    updateCaseNotes(id: bigint, notes: string): Promise<void>;
    updateChecklist(id: bigint, checklist: Checklist): Promise<void>;
    validateOpenAIConfig(): Promise<boolean>;
}
