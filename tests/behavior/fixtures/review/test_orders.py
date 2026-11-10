from orders import total
def test_total():
    rows = [{"price": 10, "qty": 2}]
    assert total(rows) == sum(row["price"] for row in rows)
