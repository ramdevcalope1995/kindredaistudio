# Backup and Recovery Strategy

## Overview
This document outlines the backup and recovery strategy for the Kindred AI Studio application.

## Database Backups

### PostgreSQL (Neon)
- **Automatic Backups**: Enabled via Neon's built-in point-in-time recovery
- **Frequency**: Continuous streaming backup
- **Retention**: Configured to retain backups for 30 days
- **Point-in-time Recovery**: Available for restoring to any point within the retention period

### Manual Backup Process
```bash
# Create a manual backup using pg_dump
pg_dump --dbname="$DATABASE_URL" --format=c --file="backup_$(date +%Y%m%d_%H%M%S).sql"
```

## Application Data Backup

### S3 Bucket Backup
- Static assets and user-generated content stored in S3
- Versioning enabled to protect against accidental deletion
- Cross-region replication configured for disaster recovery

### Configuration Backup
- Infrastructure as Code (Terraform) configurations stored in version control
- Environment variables and secrets backed up separately in AWS Systems Manager Parameter Store

## Recovery Procedures

### Database Recovery
1. **Point-in-time Recovery**:
   ```bash
   # Restore to a specific point in time using Neon Console or CLI
   neonctl branches create --parent=<source_branch> --parent-lsn=<LSN_from_backup>
   ```

2. **Manual Recovery**:
   - Restore from S3 backup file
   - Import using `pg_restore` for compressed dumps
   
### Application Recovery
1. **Infrastructure Recovery**:
   - Execute Terraform to recreate infrastructure
   - Deploy latest application images from ECR

2. **Data Recovery**:
   - Restore database from backup
   - Sync S3 assets from replicated bucket

## Backup Schedule

| Component | Frequency | Retention | Storage Location |
|-----------|-----------|-----------|------------------|
| PostgreSQL | Continuous | 30 days | Neon automatic |
| Application code | Continuous | Indefinite | GitHub |
| Infrastructure | On commit | Indefinite | GitHub |
| Static assets | Continuous | Indefinite | S3 with versioning |
| Logs | Daily | 14 days | CloudWatch |

## Testing Procedures

### Monthly Tests
- Perform recovery drill to restore database from backup
- Validate data integrity after recovery
- Document any issues or improvements needed

### Quarterly Tests
- Full disaster recovery simulation
- Test cross-region recovery procedures
- Review and update recovery procedures based on tests

## Responsibility Matrix

- **DevOps Team**: Execute and monitor backup processes
- **Engineering Team**: Implement backup-aware application features
- **Security Team**: Review encryption and access controls
- **Management**: Approve backup budget and retention policies

## Monitoring and Alerts

- Database backup completion alerts
- S3 storage utilization monitoring
- Infrastructure drift detection
- Backup verification job status

## Compliance

- GDPR compliance for data backup and recovery
- Data residency requirements for backup locations
- Encryption at rest and in transit for all backups