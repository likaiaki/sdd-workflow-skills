from service import orders
def get_orders(rows, tenant_header):
    return orders(rows, int(tenant_header))
