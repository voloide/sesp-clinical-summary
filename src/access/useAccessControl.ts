import { ref } from "vue";
import { PROFILE_ACCESS, type AccessKey } from "./access-config";

const allowed = ref<Set<AccessKey>>(new Set());

export function useAccessControl() {
  // Carrega a partir dos perfis do utilizador e da matriz PROFILE_ACCESS
  function loadFromSnapshot(userRolesUUIDs: ReadonlyArray<string>) {
    allowed.value.clear();
    const has = {
      APSS: userRolesUUIDs.some(u => PROFILE_UUIDS.APSS.includes(u)),
      ATS: userRolesUUIDs.some(u => PROFILE_UUIDS.ATS.includes(u)),
      FARMACIA: userRolesUUIDs.some(u => PROFILE_UUIDS.FARMACIA.includes(u)),
      LAB: userRolesUUIDs.some(u => PROFILE_UUIDS.LAB.includes(u)),
      PROVEDOR: userRolesUUIDs.some(u => PROFILE_UUIDS.PROVEDOR.includes(u)),
    };
    (Object.keys(has) as Array<keyof typeof PROFILE_ACCESS>)
      .filter(k => has[k as keyof typeof has])
      .forEach(k => PROFILE_ACCESS[k].forEach(key => allowed.value.add(key)));
  }

  function can(key?: AccessKey) { return !key || allowed.value.has(key); }
  function filterByAccess<T extends { permissionKey?: AccessKey }>(sections: T[]) {
    return sections.filter(s => can(s.permissionKey));
  }

  return { loadFromSnapshot, can, filterByAccess };
}

import { PROFILE_UUIDS } from "./profile-uuids.fallback"; // importa no fim (evita ordem circular)
