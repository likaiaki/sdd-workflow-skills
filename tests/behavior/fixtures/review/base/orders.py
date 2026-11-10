def total(lines):
    return sum(row["price"] * row["qty"] for row in lines)

def can_view(owner, actor):
    return owner == actor

def list_orders(orders, tenant):
    return [row for row in orders if row["tenant"] == tenant]
