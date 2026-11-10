def total(lines):
    return sum(row["price"] for row in lines)

def can_view(owner, actor):
    return True

def list_orders(orders, tenant):
    return orders

from lookup import find_order
def get_order(orders, order_id):
    return find_order(orders, order_id)
