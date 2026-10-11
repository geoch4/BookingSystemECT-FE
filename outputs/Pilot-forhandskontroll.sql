-- Read-only review BEFORE RBAC migrations. Run only in the intended database.
-- No names, personal identity numbers, emails or passwords are selected.
-- Treat the returned internal IDs as restricted administrative information.

SELECT MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId;

-- Active bookings whose source unit needs an explicit decision.
SELECT BookingId, PatientId, Status,
       COALESCE(CareUnitId, ReferralDepartment) AS LegacyDepartment
FROM Bookings
WHERE Status <> 2
  AND NULLIF(LTRIM(RTRIM(COALESCE(CareUnitId,ReferralDepartment))),N'') IS NULL;

-- Account roles and units, without exposing identity or credentials.
SELECT u.UserId, r.RoleName, u.CareUnitId,
       CASE WHEN u.PasswordHash LIKE '[$]2a[$]%' OR u.PasswordHash LIKE '[$]2b[$]%'
                  OR u.PasswordHash LIKE '[$]2y[$]%' THEN 1 ELSE 0 END AS HasExpectedHashPrefix
FROM Users u JOIN Roles r ON r.RoleId=u.RoleId
WHERE u.IsDeleted=0
ORDER BY r.RoleName,u.UserId;

-- Candidate historical department relations that will be activated by migration.
-- UNION removes overlapping sources; activity is a business decision.
WITH CandidateRelations AS (
    SELECT b.PatientId, COALESCE(b.CareUnitId,b.ReferralDepartment) AS UnitId
    FROM Bookings b JOIN Patients p ON p.PatientId=b.PatientId
    WHERE COALESCE(b.CareUnitId,b.ReferralDepartment) IS NOT NULL
      AND LEN(COALESCE(b.CareUnitId,b.ReferralDepartment))>0
    UNION
    SELECT p.PatientId,a.CareUnitId
    FROM AuditLogs a JOIN Patients p ON p.PatientId=TRY_CONVERT(int,a.EntityId)
    WHERE a.EntityName='Patient' AND a.Action='Added'
      AND a.CareUnitId IS NOT NULL AND LEN(a.CareUnitId)>0
      AND a.Role IN (N'Avdelning',N'Remitterande avdelning',N'Vårdavdelning',N'Mottagning')
)
SELECT c.PatientId,c.UnitId,
       CASE WHEN EXISTS (
         SELECT 1 FROM Users u JOIN Roles r ON r.RoleId=u.RoleId
         WHERE u.IsDeleted=0 AND u.CareUnitId=c.UnitId
         AND r.RoleName IN (N'Avdelning',N'Remitterande avdelning',N'Vårdavdelning',N'Mottagning')
       ) THEN 1 ELSE 0 END AS HasRegisteredDepartment,
       COUNT(*) OVER(PARTITION BY c.PatientId) AS DepartmentCount
FROM CandidateRelations c
ORDER BY c.PatientId,c.UnitId;
