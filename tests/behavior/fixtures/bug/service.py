from repo import list_for_tenant
def orders(rows, tenant_id):
    if tenant_id is None:
        raise ValueError("tenant required")
    return list_for_tenant(rows, tenant_id)
