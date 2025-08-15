
// src/access/profile-uuids.fallback.ts
export type ProfileName = "APSS" | "ATS" | "FARMACIA" | "LAB" | "PROVEDOR";

export const PROFILE_UUIDS: Record<ProfileName, ReadonlyArray<string>> = {
  APSS: [
    "bd520852-2ccc-11e0-8d13-0010c6dffbd1", // Recepcionista/Conselheiro/Tecnico de APSS
  ],
  ATS: [
    "e2f0acbc-1d5f-11e0-b929-000c29ad1d07", // Conselheiros ATS
  ],
  FARMACIA: [
    "e2f0b43c-1d5f-11e0-b929-000c29ad1d07", // Tecnico de Farmacia
  ],
  LAB: [
    "e2f0b55e-1d5f-11e0-b929-000c29ad1d07", // Tecnico de Laboratorio
  ],
  PROVEDOR: [
    '481db7f3-601e-4dd9-be59-3f24bc080134', // Clinico
    'e2f0acbc-1d5f-11e0-b929-000c29ad1d07', // Clinician
    'ab26016e-0941-430c-9752-6714353fdb0c', // Provider
  ],
};
