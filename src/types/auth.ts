export type Permission = string
export interface LookupOption { id: string; name: string; code: string }
export interface AuthUser {
   id: string; username: string; name?: string; first_name?: string; middle_name?: string | null; last_name?: string;
   email?: string; active?: boolean;
   user_type: LookupOption | null; department: LookupOption | null;
   permissions: Permission[];
}
export interface UserRecord {
   id: string; username: string; email: string;
   first_name: string; middle_name?: string | null; last_name: string;
   name?: string; active: boolean;
   user_type_id: string | null; department_id: string | null;
   branch_id?: string | null; region_id?: string | null;
   territory_id?: string | null; island_id?: string | null;
   user_type?: LookupOption | null; department?: LookupOption | null;
}
export interface PermissionOverride { id: string; code: string; allowed: boolean | number }
export interface UserPermissionDetails {
   user: { id: string; username: string; department: string | null; user_type: string | null };
   default_permissions: string[];
   overrides: PermissionOverride[];
   effective_permissions: string[];
}
export interface PermissionCatalogItem { id: string; code: string; name?: string; module?: { code: string; name: string; category?: string } }
