BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011130000_SeparateReferralUnits'
)
BEGIN
    ALTER TABLE [Bookings] ADD [DepartmentId] nvarchar(120) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011130000_SeparateReferralUnits'
)
BEGIN
    ALTER TABLE [Bookings] ADD [TreatmentUnitId] nvarchar(120) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011130000_SeparateReferralUnits'
)
BEGIN
    UPDATE [Bookings] SET [DepartmentId] = COALESCE([CareUnitId], [ReferralDepartment]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011130000_SeparateReferralUnits'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261011130000_SeparateReferralUnits', N'8.0.14');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011140000_PatientCareUnitMemberships'
)
BEGIN
    CREATE TABLE [PatientCareUnits] (
        [PatientId] int NOT NULL,
        [UnitId] nvarchar(120) NOT NULL,
        [Kind] nvarchar(20) NOT NULL,
        [IsActive] bit NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [Reason] nvarchar(500) NOT NULL,
        CONSTRAINT [PK_PatientCareUnits] PRIMARY KEY ([PatientId], [UnitId], [Kind]),
        CONSTRAINT [FK_PatientCareUnits_Patients_PatientId] FOREIGN KEY ([PatientId]) REFERENCES [Patients] ([PatientId]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011140000_PatientCareUnitMemberships'
)
BEGIN
    CREATE INDEX [IX_PatientCareUnits_UnitId_Kind_IsActive] ON [PatientCareUnits] ([UnitId], [Kind], [IsActive]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011140000_PatientCareUnitMemberships'
)
BEGIN

                INSERT INTO [PatientCareUnits] ([PatientId],[UnitId],[Kind],[IsActive],[UpdatedAt],[Reason])
                SELECT DISTINCT b.[PatientId],b.[DepartmentId],'department',1,SYSUTCDATETIME(),N'Migrerad avdelningsrelation'
                FROM [Bookings] b JOIN [Patients] p ON p.[PatientId]=b.[PatientId]
                WHERE b.[DepartmentId] IS NOT NULL AND LEN(b.[DepartmentId])>0;
                INSERT INTO [PatientCareUnits] ([PatientId],[UnitId],[Kind],[IsActive],[UpdatedAt],[Reason])
                SELECT DISTINCT b.[PatientId],b.[TreatmentUnitId],'treatment',1,SYSUTCDATETIME(),N'Migrerad behandlingstilldelning'
                FROM [Bookings] b JOIN [Patients] p ON p.[PatientId]=b.[PatientId]
                WHERE b.[TreatmentUnitId] IS NOT NULL AND LEN(b.[TreatmentUnitId])>0;
                INSERT INTO [PatientCareUnits] ([PatientId],[UnitId],[Kind],[IsActive],[UpdatedAt],[Reason])
                SELECT DISTINCT p.[PatientId],a.[CareUnitId],'department',1,SYSUTCDATETIME(),N'Migrerad patientskapandehändelse'
                FROM [AuditLogs] a JOIN [Patients] p ON p.[PatientId]=TRY_CONVERT(int,a.[EntityId])
                WHERE a.[EntityName]='Patient' AND a.[Action]='Added' AND a.[CareUnitId] IS NOT NULL AND LEN(a.[CareUnitId])>0
                AND a.[Role] IN (N'Avdelning',N'Remitterande avdelning',N'Vårdavdelning',N'Mottagning')
                AND NOT EXISTS (SELECT 1 FROM [PatientCareUnits] m WHERE m.[PatientId]=p.[PatientId] AND m.[UnitId]=a.[CareUnitId] AND m.[Kind]='department');

END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011140000_PatientCareUnitMemberships'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261011140000_PatientCareUnitMemberships', N'8.0.14');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011150000_AccountSessionVersion'
)
BEGIN
    ALTER TABLE [Users] ADD [SessionVersion] nvarchar(32) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011150000_AccountSessionVersion'
)
BEGIN
    UPDATE [Users] SET [SessionVersion]=REPLACE(CONVERT(nvarchar(36),NEWID()),'-','');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261011150000_AccountSessionVersion'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261011150000_AccountSessionVersion', N'8.0.14');
END;
GO

COMMIT;
GO
