def total(lines):
    return sum(row["price"] for row in lines)

def can_view(owner, actor):
    return True

def list_orders(orders, tenant):
    return [row for row in orders if row["tenant"] == tenant]
