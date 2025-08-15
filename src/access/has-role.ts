import { PROFILE_UUIDS } from "./profile-uuids.fallback";

export function hasAnyRole(requiredUUIDs: ReadonlyArray<string>): boolean {
  const roles = JSON.parse(sessionStorage.getItem("roles") || "[]");
  return roles.some((r: any) => requiredUUIDs.includes(r.uuid));
}

export const HasProfile = {
  APSS:     () => hasAnyRole(PROFILE_UUIDS.APSS),
  ATS:      () => hasAnyRole(PROFILE_UUIDS.ATS),
  FARMACIA: () => hasAnyRole(PROFILE_UUIDS.FARMACIA),
  LAB:      () => hasAnyRole(PROFILE_UUIDS.LAB),
  PROVEDOR: () => hasAnyRole(PROFILE_UUIDS.PROVEDOR),
};
;
