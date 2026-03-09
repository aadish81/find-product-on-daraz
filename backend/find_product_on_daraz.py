import re
import aiohttp
from flask import Flask, request, jsonify
from flask_cors import CORS



app = Flask(__name__)
CORS(app)

class BrandUtils:

    @staticmethod
    def prepare_brand(brand):
        brand_lower = brand.lower()
        parts = re.split(r"[&,+-]", brand_lower)
        return [p.strip() for p in parts if p.strip()]

    @staticmethod
    def jaccard_similarity_for_brand(brand1, brand2):

        b1 = BrandUtils.prepare_brand(brand1)
        b2 = BrandUtils.prepare_brand(brand2)

        if not b1 or not b2:
            return 0

        set1 = set(b1)
        set2 = set(b2)

        intersection = set1 & set2
        union = set1 | set2

        return len(intersection) / len(union) if union else 0


class TextProcessor:

    STOPWORDS = {
        "new", "latest", "official", "warranty", "years",
        "year", "model", "with", "and"
    }

    @staticmethod
    def normalize(text):

        text = text.lower()
        text = re.sub(r"[^\w\s]", " ", text)
        text = re.sub(r"(\d+)\s*gb", r"\1gb", text)

        words = text.split()

        return [w for w in words if w not in TextProcessor.STOPWORDS]

    @staticmethod
    def extract_features(text):

        text = text.lower()

        storage = set(re.findall(r'\d+\s?gb', text))
        capacity = set(re.findall(r'\d+\.?\d*\s?l', text))
        screen = set(re.findall(r'\d+\s?(inch|in)', text))
        numbers = set(re.findall(r"(?<![A-Za-z])\d+\.?\d*(?![A-Za-z])", text))

        return {
            "storage": storage,
            "capacity": capacity,
            "screen": screen,
            "numbers": numbers
        }

    @staticmethod
    def jaccard_similarity(a, b):

        set1 = set(TextProcessor.normalize(a))
        set2 = set(TextProcessor.normalize(b))

        intersection = set1 & set2
        union = set1 | set2

        return len(intersection) / len(union) if union else 0


class ProductMatcher:

    @staticmethod
    def price_close(p1, p2, tolerance=0.15):
        p1 = float(p1)
        p2 = float(p2)
        diff = abs(p1 - p2)
        avg = (p1 + p2) / 2

        return diff / avg <= tolerance

    @staticmethod
    def feature_match(f1, f2):

        if f1["storage"] and f2["storage"]:
            if f1["storage"] != f2["storage"]:
                return False

        if f1["capacity"] and f2["capacity"]:
            if f1["capacity"] != f2["capacity"]:
                return False

        if f1["screen"] and f2["screen"]:
            if f1["screen"] != f2["screen"]:
                return False

        if f1["numbers"] and f2["numbers"]:
            if not (f1["numbers"] & f2["numbers"]):
                return False

        return True

    @staticmethod
    def detect_brand_in_title(title, brand):

        brand_parts = BrandUtils.prepare_brand(brand)
        title = title.lower()

        fav = 0
        total = len(brand_parts)

        for b in brand_parts:
            if b in title:
                fav += 1

        if total > 0 and fav / total > 0.8:
            return brand

        return None

    @staticmethod
    def same_product(name1, brand1, price1, name2, brand2, price2):

        if brand2 == "No Brand" or brand2 == "":
            brand2 = ProductMatcher.detect_brand_in_title(name2, brand1)

        brand_ok = (
            BrandUtils.jaccard_similarity_for_brand(brand1, brand2) > 0.8
            if brand1 and brand2 else True
        )

        if not brand_ok:
            return False, "brand mismatch"

        sim = TextProcessor.jaccard_similarity(name1, name2)

        f1 = TextProcessor.extract_features(name1)
        f2 = TextProcessor.extract_features(name2)

        features_ok = ProductMatcher.feature_match(f1, f2)
        price_ok = ProductMatcher.price_close(price1, price2)

        if sim > 0.4 and price_ok and features_ok:
            return True, sim

        return False, sim


class DarazAPI:

    BASE_URL = "https://www.daraz.com.np/catalog/"
    headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    }

    async def fetch_products(self, session, query, page=1):

        url = f"{self.BASE_URL}?ajax=true&q={query}&page={page}"

        async with session.get(url, headers=self.headers) as response:

            if response.status != 200:
                return []

            data = await response.json()

            return data.get('mods', {}).get('listItems', [])


class ProductFinder:

    def __init__(self):
        self.api = DarazAPI()

    async def find_same_products(self, name1, brand1, price1):

        async with aiohttp.ClientSession() as session:

            items = await self.api.fetch_products(session, name1)

            

            for product in items[:5]:

                name = product.get('name', 'N/A')
                original_price = int(product.get('originalPrice', 0))
                discounted_price = int(product.get('price', 0))
                brand_name = product.get('brandName', 'No Brand')

                result, score = ProductMatcher.same_product(
                    name1, brand1, price1,
                    name, brand_name, discounted_price
                )
                if result:
                    return [{
                        "name": name,
                        "brand": brand1,
                        "original_price": original_price,
                        "discounted_price": discounted_price,
                        "similarity": score,
                        "same_product": result
                    }]

        # If loop finishes without finding match
        return [{
            "same_product": False,
            "message": "No matching product found"
        }]


finder = ProductFinder()


@app.route("/product-match", methods=["POST"])
async def product_match():

    data = request.json

    name = data.get("productName")
    brand = data.get("brandName")
    price = data.get("price")

    if not name or not price:
        return jsonify({"error": "name and price required"}), 400

    results = await finder.find_same_products(name, brand, price)

    return jsonify({
        "results": results
    })

@app.route("/")
def home():
    return "Welcome to the Product Comparison API! Use the /product-match endpoint to find similar products on Daraz."

if __name__ == "__main__":
    app.run(debug=True)