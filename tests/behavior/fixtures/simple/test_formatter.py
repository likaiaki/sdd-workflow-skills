import unittest
from formatter import total_text
class FormatTest(unittest.TestCase):
    def test_zero(self): self.assertEqual(total_text(0), "0.00")
    def test_amount(self): self.assertEqual(total_text(105), "1.05")
