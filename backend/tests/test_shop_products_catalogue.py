"""
Test suite for Chutex Care Shop - Extended Product Catalogue (14 products, 4 categories)
Tests: GET /api/shop/products with category filtering, POST /api/shop/checkout with new products
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestProductCatalogue:
    """Tests for GET /api/shop/products endpoint with 14 products across 4 categories"""
    
    def test_get_all_products_returns_14(self):
        """Verify total product count is 14"""
        response = requests.get(f"{BASE_URL}/api/shop/products")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 14, f"Expected 14 products, got {len(data['products'])}"
    
    def test_category_devices_returns_2(self):
        """Verify devices category has 2 products: elder-vest, vita-scale"""
        response = requests.get(f"{BASE_URL}/api/shop/products?category=devices")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 2, f"Expected 2 devices, got {len(data['products'])}"
        product_ids = [p["id"] for p in data["products"]]
        assert "elder-vest" in product_ids
        assert "vita-scale" in product_ids
    
    def test_category_subscriptions_returns_4(self):
        """Verify subscriptions category has 4 Elio plans"""
        response = requests.get(f"{BASE_URL}/api/shop/products?category=subscriptions")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 4, f"Expected 4 subscriptions, got {len(data['products'])}"
        product_ids = [p["id"] for p in data["products"]]
        assert "elio-standard" in product_ids
        assert "elio-sport" in product_ids
        assert "elio-physio" in product_ids
        assert "elio-care" in product_ids
    
    def test_category_accessories_returns_6(self):
        """Verify accessories category has 6 products including helium cartridges"""
        response = requests.get(f"{BASE_URL}/api/shop/products?category=accessories")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 6, f"Expected 6 accessories, got {len(data['products'])}"
        product_ids = [p["id"] for p in data["products"]]
        assert "cartouche-helium-x2" in product_ids
        assert "cartouche-helium-x4" in product_ids
        assert "chargeur-elder" in product_ids
        assert "chargeur-elio" in product_ids
        assert "bracelet-elio-spare" in product_ids
        assert "housse-elder" in product_ids
    
    def test_category_bundles_returns_2(self):
        """Verify bundles category has 2 products"""
        response = requests.get(f"{BASE_URL}/api/shop/products?category=bundles")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 2, f"Expected 2 bundles, got {len(data['products'])}"
        product_ids = [p["id"] for p in data["products"]]
        assert "elder-teleassistance" in product_ids
        assert "bundle-elio-elder" in product_ids


class TestProductDetails:
    """Tests for product structure and pricing"""
    
    def test_elio_subscriptions_have_subscription_price(self):
        """Verify Elio subscriptions have price=0 and subscription_price>0"""
        response = requests.get(f"{BASE_URL}/api/shop/products?category=subscriptions")
        assert response.status_code == 200
        data = response.json()
        for product in data["products"]:
            assert product["price"] == 0, f"{product['id']} should have price=0"
            assert product.get("subscription_price", 0) > 0, f"{product['id']} should have subscription_price>0"
            assert product["type"] == "subscription"
    
    def test_accessories_have_correct_prices(self):
        """Verify accessory prices"""
        response = requests.get(f"{BASE_URL}/api/shop/products?category=accessories")
        assert response.status_code == 200
        data = response.json()
        prices = {p["id"]: p["price"] for p in data["products"]}
        assert prices["cartouche-helium-x2"] == 39.90
        assert prices["cartouche-helium-x4"] == 69.90
        assert prices["chargeur-elder"] == 19.90
        assert prices["chargeur-elio"] == 14.90
        assert prices["bracelet-elio-spare"] == 24.90
        assert prices["housse-elder"] == 49.90
    
    def test_spare_strap_has_3_color_variants(self):
        """Verify spare strap has 3 color variants"""
        response = requests.get(f"{BASE_URL}/api/shop/products?category=accessories")
        assert response.status_code == 200
        data = response.json()
        spare_strap = next((p for p in data["products"] if p["id"] == "bracelet-elio-spare"), None)
        assert spare_strap is not None
        assert len(spare_strap["variants"]) == 3
        variant_ids = [v["id"] for v in spare_strap["variants"]]
        assert "bracelet-spare-noir" in variant_ids
        assert "bracelet-spare-gris" in variant_ids
        assert "bracelet-spare-bleu" in variant_ids
    
    def test_textile_cover_has_4_size_variants(self):
        """Verify textile cover has 4 size variants"""
        response = requests.get(f"{BASE_URL}/api/shop/products?category=accessories")
        assert response.status_code == 200
        data = response.json()
        cover = next((p for p in data["products"] if p["id"] == "housse-elder"), None)
        assert cover is not None
        assert len(cover["variants"]) == 4
        variant_ids = [v["id"] for v in cover["variants"]]
        assert "housse-elder-s" in variant_ids
        assert "housse-elder-m" in variant_ids
        assert "housse-elder-l" in variant_ids
        assert "housse-elder-xl" in variant_ids


class TestCheckoutWithNewProducts:
    """Tests for checkout with new catalogue products"""
    
    def test_checkout_with_helium_cartridge_x2(self):
        """Test checkout with cartouche-helium-x2"""
        response = requests.post(f"{BASE_URL}/api/shop/checkout", json={
            "items": [{"product_id": "cartouche-helium-x2", "quantity": 1}],
            "email": "test_helium@example.com",
            "first_name": "Test",
            "last_name": "Helium",
            "address": "123 Test St",
            "city": "Paris",
            "postal_code": "75001",
            "country": "FR"
        })
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert data["total"] == 39.90
        assert data["checkout_url"].startswith("https://www.mollie.com")
    
    def test_checkout_with_elio_subscription(self):
        """Test checkout with Elio subscription (price=0, subscription_price>0)"""
        response = requests.post(f"{BASE_URL}/api/shop/checkout", json={
            "items": [{"product_id": "elio-standard", "quantity": 1}],
            "email": "test_elio@example.com",
            "first_name": "Test",
            "last_name": "Elio",
            "address": "123 Test St",
            "city": "Paris",
            "postal_code": "75001",
            "country": "FR"
        })
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert data["total"] == 0  # One-time price is 0
        assert data["subscription_monthly"] == 24.90
        assert data["checkout_url"].startswith("https://www.mollie.com")
    
    def test_checkout_with_bundle_elio_elder(self):
        """Test checkout with bundle-elio-elder (hybrid: one-time + subscription)"""
        response = requests.post(f"{BASE_URL}/api/shop/checkout", json={
            "items": [{"product_id": "bundle-elio-elder", "variant_id": "bundle-elio-elder-m", "quantity": 1}],
            "email": "test_bundle@example.com",
            "first_name": "Test",
            "last_name": "Bundle",
            "address": "123 Test St",
            "city": "Paris",
            "postal_code": "75001",
            "country": "FR"
        })
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert data["total"] == 879.00
        assert data["subscription_monthly"] == 79.90
        assert data["checkout_url"].startswith("https://www.mollie.com")
    
    def test_checkout_with_spare_strap_variant(self):
        """Test checkout with spare strap color variant"""
        response = requests.post(f"{BASE_URL}/api/shop/checkout", json={
            "items": [{"product_id": "bracelet-elio-spare", "variant_id": "bracelet-spare-bleu", "quantity": 2}],
            "email": "test_strap@example.com",
            "first_name": "Test",
            "last_name": "Strap",
            "address": "123 Test St",
            "city": "Paris",
            "postal_code": "75001",
            "country": "FR"
        })
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert data["total"] == 49.80  # 24.90 * 2
        assert data["checkout_url"].startswith("https://www.mollie.com")


class TestInvalidCategory:
    """Tests for invalid category handling"""
    
    def test_invalid_category_returns_empty(self):
        """Verify invalid category returns empty list"""
        response = requests.get(f"{BASE_URL}/api/shop/products?category=invalid")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 0
    
    def test_empty_category_returns_all(self):
        """Verify empty category returns all products"""
        response = requests.get(f"{BASE_URL}/api/shop/products?category=")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 14
