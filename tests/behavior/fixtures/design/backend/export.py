from dataclasses import dataclass, field
@dataclass
class ExportJob:
    id: str
    status: str = "queued"
    attempts: list = field(default_factory=list)
def retry(job, attempt_id):
    if job.status != "failed":
        raise ValueError("only failed tasks can retry")
    job.attempts.append({"id": attempt_id, "status": "queued"})
    job.status = "queued"
    return job
# Legacy route: POST /api/export_jobs/{id}/retry
