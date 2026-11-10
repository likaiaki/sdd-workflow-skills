import unittest
from api import get_orders
ROWS = [{"id": "a", "tenant": 0}, {"id": "b", "tenant": 1}]
class OrdersTest(unittest.TestCase):
    def test_tenant_one(self):
        self.assertEqual(get_orders(ROWS, "1"), [{"id": "b", "tenant": 1}])
