import { MembershipRole } from "@prisma/client";

export const ADMIN_ROLES: MembershipRole[] = [MembershipRole.OWNER, MembershipRole.MANAGER];
export const OPERATOR_ROLES: MembershipRole[] = [
  MembershipRole.OWNER,
  MembershipRole.MANAGER,
  MembershipRole.TECHNICIAN,
];
export const ALL_APP_ROLES: MembershipRole[] = [
  MembershipRole.OWNER,
  MembershipRole.MANAGER,
  MembershipRole.TECHNICIAN,
  MembershipRole.CUSTOMER,
];

export function hasRole(role: MembershipRole | undefined, allowed: MembershipRole[]) {
  if (!role) {
    return false;
  }
  return allowed.includes(role);
}
