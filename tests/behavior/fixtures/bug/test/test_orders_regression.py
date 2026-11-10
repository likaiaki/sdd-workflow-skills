import unittest

from api import get_orders
from service import orders


class TenantIsolationTest(unittest.TestCase):
    def setUp(self):
        self.rows = [
            {"id": "a", "tenant": 0},
            {"id": "b", "tenant": 1},
        ]

    def test_tenant_zero_receives_only_own_orders(self):
        self.assertEqual(
            get_orders(self.rows, "0"),
            [{"id": "a", "tenant": 0}],
        )
        self.assertEqual(
            self.rows,
            [{"id": "a", "tenant": 0}, {"id": "b", "tenant": 1}],
        )

    def test_tenant_without_orders_receives_empty_list(self):
        self.assertEqual(get_orders(self.rows, "2"), [])

    def test_missing_tenant_stays_rejected(self):
        with self.assertRaisesRegex(ValueError, "tenant required"):
            orders(self.rows, None)

    def test_invalid_header_stays_rejected(self):
        with self.assertRaises(ValueError):
            get_orders(self.rows, "invalid")
