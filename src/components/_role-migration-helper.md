# Role Migration Helper

This file documents the changes needed for role migration from `profiles.role` to `user_roles` table.

## Pattern to Replace

OLD: `const { profile } = useAuth(); ... profile?.role`
NEW: `const { role } = usePermissions(); ... role`

## Files Still Needing Updates

1. AddExhibitDialog.tsx
2. CaseManagement.tsx 
3. CaseSearch.tsx
4. CreateCaseFileDialog.tsx
5. OfficialReportsTable.tsx
6. TeamManagement.tsx
7. UserManagement.tsx
8. UserPresence.tsx
9. AnalyticsDashboard.tsx
10. UnassignedCasesForOCU.tsx
11. UserTable.tsx

## Steps

1. Add usePermissions import
2. Get role from usePermissions hook  
3. Replace all `profile?.role` with `role`
4. Remove role from database queries
5. Remove role from TypeScript interfaces
