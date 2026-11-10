def list_for_tenant(rows, tenant_id):
    if tenant_id:
        return [row for row in rows if row["tenant"] == tenant_id]
    return rows
