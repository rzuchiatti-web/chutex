"""
Test Shop Cart & Checkout Integration (Iteration 225)
Tests: GET /api/shop/products, POST /api/shop/checkout, GET /api/shop/order/{id}, POST /api/shop/mollie/webhook
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestShopProducts:
    """Test GET /api/shop/products endpoint"""
    
    def test_get_products_returns_200(self):
        """Products endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/shop/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/shop/products returns 200")
    
    def test_get_products_returns_4_products(self):
        """Should return exactly 4 products"""
        response = requests.get(f"{BASE_URL}/api/shop/products")
        data = response.json()
        assert "products" in data, "Response should have 'products' key"
        assert len(data["products"]) == 4, f"Expected 4 products, got {len(data['products'])}"
        print(f"✓ Products endpoint returns {len(data['products'])} products")
    
    def test_products_have_required_fields(self):
        """Each product should have id, name, price, type, image"""
        response = requests.get(f"{BASE_URL}/api/shop/products")
        data = response.json()
        required_fields = ["id", "name", "price", "type", "image"]
        for product in data["products"]:
            for field in required_fields:
                assert field in product, f"Product missing field: {field}"
        print("✓ All products have required fields")
    
    def test_elder_vest_product_exists(self):
        """elder-vest product should exist with correct data"""
        response = requests.get(f"{BASE_URL}/api/shop/products")
        data = response.json()
        elder_vest = next((p for p in data["products"] if p["id"] == "elder-vest"), None)
        assert elder_vest is not None, "elder-vest product not found"
        assert elder_vest["price"] == 879.0, f"Expected price 879, got {elder_vest['price']}"
        assert elder_vest["type"] == "one-time", f"Expected type 'one-time', got {elder_vest['type']}"
        assert len(elder_vest.get("variants", [])) == 4, "elder-vest should have 4 size variants"
        print("✓ elder-vest product exists with correct data")
    
    def test_elder_teleassistance_product_exists(self):
        """elder-teleassistance product should exist with subscription price"""
        response = requests.get(f"{BASE_URL}/api/shop/products")
        data = response.json()
        elder_tele = next((p for p in data["products"] if p["id"] == "elder-teleassistance"), None)
        assert elder_tele is not None, "elder-teleassistance product not found"
        assert elder_tele["price"] == 879.0
        assert elder_tele.get("subscription_price") == 29.9, f"Expected subscription_price 29.9, got {elder_tele.get('subscription_price')}"
        assert elder_tele["type"] == "hybrid"
        print("✓ elder-teleassistance product exists with subscription price")
    
    def test_elio_bracelet_product_exists(self):
        """elio-bracelet product should exist (subscription only)"""
        response = requests.get(f"{BASE_URL}/api/shop/products")
        data = response.json()
        elio = next((p for p in data["products"] if p["id"] == "elio-bracelet"), None)
        assert elio is not None, "elio-bracelet product not found"
        assert elio["price"] == 0, "elio-bracelet should have price 0 (subscription only)"
        assert elio.get("subscription_price") == 24.9
        assert elio["type"] == "subscription"
        print("✓ elio-bracelet product exists (subscription only)")
    
    def test_vita_scale_product_exists(self):
        """vita-scale product should exist"""
        response = requests.get(f"{BASE_URL}/api/shop/products")
        data = response.json()
        vita = next((p for p in data["products"] if p["id"] == "vita-scale"), None)
        assert vita is not None, "vita-scale product not found"
        assert vita["price"] == 229.0
        assert vita["type"] == "one-time"
        print("✓ vita-scale product exists")


class TestShopCheckout:
    """Test POST /api/shop/checkout endpoint"""
    
    def test_checkout_creates_order_and_returns_mollie_url(self):
        """Checkout should create order and return Mollie checkout URL"""
        payload = {
            "items": [{"product_id": "elder-vest", "variant_id": "elder-vest-m", "quantity": 1}],
            "email": "test@chutex.com",
            "first_name": "Test",
            "last_name": "User",
            "address": "1 rue test",
            "city": "Paris",
            "postal_code": "75001",
            "country": "FR",
            "lang": "fr"
        }
        response = requests.post(f"{BASE_URL}/api/shop/checkout", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "order_id" in data, "Response should have order_id"
        assert "checkout_url" in data, "Response should have checkout_url"
        assert "total" in data, "Response should have total"
        
        # Verify Mollie URL
        assert data["checkout_url"].startswith("https://www.mollie.com/checkout") or data["checkout_url"].startswith("https://www.mollie.com/payscreen"), \
            f"checkout_url should be Mollie URL, got: {data['checkout_url']}"
        
        # Verify total
        assert data["total"] == 879.0, f"Expected total 879, got {data['total']}"
        
        print(f"✓ Checkout created order {data['order_id']} with Mollie URL")
        return data["order_id"]
    
    def test_checkout_with_subscription_product(self):
        """Checkout with subscription product should include subscription_monthly"""
        payload = {
            "items": [{"product_id": "elder-teleassistance", "variant_id": "elder-tele-l", "quantity": 1}],
            "email": "test2@chutex.com",
            "first_name": "Test",
            "last_name": "Subscription",
            "address": "2 rue test",
            "city": "Lyon",
            "postal_code": "69001",
            "country": "FR",
            "lang": "fr"
        }
        response = requests.post(f"{BASE_URL}/api/shop/checkout", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["total"] == 879.0
        assert data.get("subscription_monthly") == 29.9, f"Expected subscription_monthly 29.9, got {data.get('subscription_monthly')}"
        print(f"✓ Checkout with subscription product includes subscription_monthly: {data['subscription_monthly']}")
    
    def test_checkout_empty_cart_returns_400(self):
        """Checkout with empty cart should return 400"""
        payload = {
            "items": [],
            "email": "test@chutex.com",
            "first_name": "Test",
            "last_name": "User",
            "address": "1 rue test",
            "city": "Paris",
            "postal_code": "75001",
            "country": "FR",
            "lang": "fr"
        }
        response = requests.post(f"{BASE_URL}/api/shop/checkout", json=payload)
        assert response.status_code == 400, f"Expected 400 for empty cart, got {response.status_code}"
        print("✓ Empty cart checkout returns 400")
    
    def test_checkout_invalid_product_returns_400(self):
        """Checkout with invalid product should return 400"""
        payload = {
            "items": [{"product_id": "invalid-product", "variant_id": None, "quantity": 1}],
            "email": "test@chutex.com",
            "first_name": "Test",
            "last_name": "User",
            "address": "1 rue test",
            "city": "Paris",
            "postal_code": "75001",
            "country": "FR",
            "lang": "fr"
        }
        response = requests.post(f"{BASE_URL}/api/shop/checkout", json=payload)
        assert response.status_code == 400, f"Expected 400 for invalid product, got {response.status_code}"
        print("✓ Invalid product checkout returns 400")


class TestShopOrder:
    """Test GET /api/shop/order/{order_id} endpoint"""
    
    @pytest.fixture
    def created_order_id(self):
        """Create an order and return its ID"""
        payload = {
            "items": [{"product_id": "elder-vest", "variant_id": "elder-vest-s", "quantity": 1}],
            "email": "ordertest@chutex.com",
            "first_name": "Order",
            "last_name": "Test",
            "address": "3 rue test",
            "city": "Marseille",
            "postal_code": "13001",
            "country": "FR",
            "lang": "fr"
        }
        response = requests.post(f"{BASE_URL}/api/shop/checkout", json=payload)
        assert response.status_code == 200
        return response.json()["order_id"]
    
    def test_get_order_returns_order_details(self, created_order_id):
        """GET /api/shop/order/{id} should return order details"""
        response = requests.get(f"{BASE_URL}/api/shop/order/{created_order_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify order structure
        assert data["order_id"] == created_order_id
        assert data["status"] == "pending_payment"
        assert "items" in data
        assert "total" in data
        assert "customer" in data
        
        # Verify items
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == "elder-vest"
        assert data["items"][0]["variant_id"] == "elder-vest-s"
        
        # Verify customer info
        assert data["customer"]["email"] == "ordertest@chutex.com"
        assert data["customer"]["first_name"] == "Order"
        assert data["customer"]["last_name"] == "Test"
        
        print(f"✓ GET /api/shop/order/{created_order_id} returns correct order details")
    
    def test_get_nonexistent_order_returns_404(self):
        """GET /api/shop/order/{invalid_id} should return 404"""
        response = requests.get(f"{BASE_URL}/api/shop/order/NONEXISTENT123")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Nonexistent order returns 404")


class TestMollieWebhook:
    """Test POST /api/shop/mollie/webhook endpoint"""
    
    def test_webhook_with_empty_body_returns_ok(self):
        """Webhook with empty body should return ok (graceful handling)"""
        response = requests.post(f"{BASE_URL}/api/shop/mollie/webhook", data="")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "ok", f"Expected status 'ok', got {data}"
        print("✓ Webhook with empty body returns ok")
    
    def test_webhook_with_invalid_payment_id_returns_ok(self):
        """Webhook with invalid payment ID should return ok (graceful handling)"""
        response = requests.post(f"{BASE_URL}/api/shop/mollie/webhook", data="id=invalid_payment_id")
        # Should return 200 even with invalid ID (graceful handling)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Webhook with invalid payment ID returns ok (graceful)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
