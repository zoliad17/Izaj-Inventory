"""
Generate Excel file with products for branch_id = 3
All products match the validation requirements:
- Product Name: required, non-empty
- Category: must match existing category names (case-insensitive)
- Price: numeric, > 0
- Quantity: numeric, >= 0
- Status: "In Stock", "Out of Stock", or "Low Stock"
"""

import pandas as pd
import random
from pathlib import Path

# Category names based on existing products in the database
# IMPORTANT: These must match exactly with database category names
CATEGORIES = [
    "Chandelier",
    "Bulb",
    "Pendant Light",
    "Ceiling Light",
    "Wall Lamp",
    "Table Lamp",
    "Floor Lamp",
    "Track Lighting",
    "Recessed Lighting",
    "Outdoor Lighting",
    "Smart Lighting",
    "LED Strip",
    "Lantern",
    "Spotlight",
    "Emergency Light"
]

# Product templates by category
PRODUCT_TEMPLATES = {
    "Chandelier": [
        "Crystal Cascade Chandelier {size}mm",
        "Vintage Bronze Chandelier {lights}-Light E14",
        "Modern Linear Chandelier {lights}-Light Brushed Nickel",
        "Classic Crystal Chandelier {size}mm",
        "Contemporary Chandelier {lights}-Light",
    ],
    "Bulb": [
        "Color-Changing LED Bulb E27 {watt}W",
        "Dimmable LED Bulb {watt}W {temp}K Soft White",
        "LED Smart Bulb {watt}W RGB WiFi",
        "LED Bulb {watt}W Warm White",
        "LED Bulb {watt}W Cool White",
        "Smart LED Bulb {watt}W Tunable",
    ],
    "Pendant Light": [
        "Industrial Pendant Light Black Matte {size}mm",
        "Modern Pendant Light Adjustable Height Gold",
        "Glass Pendant Light Ø{size}mm Clear",
        "Rustic Pendant Light Wood Finish",
        "Minimalist Pendant Light {size}mm",
    ],
    "Ceiling Light": [
        "Flush-Mount Ceiling Light Round {size}mm",
        "LED Panel Ceiling Light {size}×{size} {watt}W",
        "Decorative Ceiling Light Gold Finish {size}mm",
        "Recessed Ceiling Light {watt}W",
        "Semi-Flush Ceiling Light {size}mm",
    ],
    "Wall Lamp": [
        "Decorative Wall Light Crystal Accent",
        "Reading Wall Lamp ARM Adjustable {size}mm",
        "Modern Wall Sconce Brushed Nickel",
        "Outdoor Wall Light {watt}W",
        "Bathroom Wall Light {size}mm",
    ],
    "Table Lamp": [
        "Bedside Table Lamp Fabric Shade {size}mm",
        "Study Lamp Adjustable Arm {watt}W LED",
        "Desk Lamp LED {watt}W Touch Control",
        "Modern Table Lamp {size}mm",
        "Reading Table Lamp {watt}W",
    ],
    "Floor Lamp": [
        "Arc Floor Lamp Black {height}mm",
        "Reading Floor Lamp LED Ring {height}mm",
        "Modern Floor Lamp 3-Arm Brass Finish",
        "Torchiere Floor Lamp {watt}W",
        "Tripod Floor Lamp {height}mm",
    ],
    "Track Lighting": [
        "Spotlight Track System {heads}-Head Rail",
        "LED Track Light {watt}W Black Rail",
        "Adjustable Track Light {watt}W White",
        "Pendant Track Light System",
        "Track Light Kit {heads} Heads",
    ],
    "Recessed Lighting": [
        "Smart Recessed Light WiFi {watt}W",
        "LED Downlight {watt}W {temp}K Round",
        "Adjustable Recessed Light {watt}W Square",
        "Gimbal Recessed Light {watt}W",
        "Ultra-Thin Recessed Light {watt}W",
    ],
    "Outdoor Lighting": [
        "Security Flood Light {watt}W Motion Sensor",
        "Pathway Light Stainless Steel {size}mm",
        "Garden Light LED Spike {size}mm",
        "Wall-Mounted Outdoor Light {watt}W",
        "Solar Outdoor Light {watt}W",
    ],
    "Smart Lighting": [
        "Smart Ceiling Light WiFi {watt}W",
        "Smart LED Strip {length}m RGB + Controller",
        "Smart Wall Light Voice Control {watt}W",
        "Smart Bulb WiFi {watt}W",
        "Smart Light Switch WiFi",
    ],
    "LED Strip": [
        "Flexible LED Tape {length}m 12V",
        "RGB LED Strip {length}m SMD5050 Waterproof",
        "White LED Strip {length}m {temp}K",
        "Addressable LED Strip {length}m",
        "LED Strip Kit {length}m RGB",
    ],
    "Lantern": [
        "Solar Lantern LED Flicker Flame 3-Hour",
        "Hanging Lantern Capiz Shell Ø{size}mm",
        "Garden Lantern Solar Powered {size}mm",
        "Decorative Lantern {size}mm",
        "Outdoor Lantern {watt}W",
    ],
    "Spotlight": [
        "Adjustable Spotlight {watt}W Track Mount",
        "LED Spotlight {watt}W Flood Beam",
        "Garden Spotlight {watt}W Ground Stake",
        "Wall Spotlight {watt}W",
        "Recessed Spotlight {watt}W",
    ],
    "Emergency Light": [
        "Backup Light LED {watt}W Auto Recharge",
        "Exit Sign Light Double Face 3H Backup",
        "LED Emergency Light Built-In Battery {watt}W",
        "Emergency Exit Light {watt}W",
        "Portable Emergency Light {watt}W",
    ],
}

# Price ranges by category (min, max)
PRICE_RANGES = {
    "Chandelier": (5000, 60000),
    "Bulb": (100, 2000),
    "Pendant Light": (2000, 15000),
    "Ceiling Light": (1500, 12000),
    "Wall Lamp": (1000, 5000),
    "Table Lamp": (800, 5000),
    "Floor Lamp": (3000, 10000),
    "Track Lighting": (2000, 15000),
    "Recessed Lighting": (1500, 8000),
    "Outdoor Lighting": (1500, 10000),
    "Smart Lighting": (2000, 12000),
    "LED Strip": (300, 10000),
    "Lantern": (500, 4000),
    "Spotlight": (1500, 5000),
    "Emergency Light": (1000, 4000),
}

# Quantity ranges by category (min, max)
QUANTITY_RANGES = {
    "Chandelier": (0, 500),
    "Bulb": (0, 500),
    "Pendant Light": (0, 500),
    "Ceiling Light": (0, 500),
    "Wall Lamp": (0, 500),
    "Table Lamp": (0, 500),
    "Floor Lamp": (0, 500),
    "Track Lighting": (0, 500),
    "Recessed Lighting": (0, 500),
    "Outdoor Lighting": (0, 500),
    "Smart Lighting": (0, 500),
    "LED Strip": (0, 500),
    "Lantern": (0, 500),
    "Spotlight": (0, 500),
    "Emergency Light": (0, 500),
}


def generate_product_name(category):
    """Generate a product name based on category template"""
    templates = PRODUCT_TEMPLATES[category]
    template = random.choice(templates)
    
    # Replace placeholders
    if "{size}" in template:
        sizes = [250, 300, 400, 500, 600, 800, 1000, 1200]
        template = template.replace("{size}", str(random.choice(sizes)))
    
    if "{lights}" in template:
        lights = [3, 4, 5, 6, 8, 12]
        template = template.replace("{lights}", str(random.choice(lights)))
    
    if "{watt}" in template:
        watts = [5, 7, 9, 10, 12, 15, 18, 20, 30, 36, 40, 50]
        template = template.replace("{watt}", str(random.choice(watts)))
    
    if "{temp}" in template:
        temps = [2700, 3000, 4000, 5000]
        template = template.replace("{temp}", str(random.choice(temps)))
    
    if "{height}" in template:
        heights = [1600, 1800, 2000]
        template = template.replace("{height}", str(random.choice(heights)))
    
    if "{heads}" in template:
        heads = [3, 4, 6, 8]
        template = template.replace("{heads}", str(random.choice(heads)))
    
    if "{length}" in template:
        lengths = [3, 5, 10]
        template = template.replace("{length}", str(random.choice(lengths)))
    
    return template


def determine_status(quantity):
    """Determine status based on quantity"""
    # All products will be in stock as per requirement
    return "In Stock"


def generate_products(num_products=50):
    """Generate products for branch_id = 3"""
    products = []
    
    # Ensure we have products from each category
    categories_per_product = max(1, len(CATEGORIES) // num_products)
    
    for i in range(num_products):
        # Select category
        if i < len(CATEGORIES):
            category = CATEGORIES[i]
        else:
            category = random.choice(CATEGORIES)
        
        # Generate product name
        product_name = generate_product_name(category)
        
        # Generate price
        price_min, price_max = PRICE_RANGES[category]
        price = round(random.uniform(price_min, price_max), 2)
        
        # Set quantity to 500 for all products as per requirement
        quantity = 500
        
        # Determine status (all products will be in stock)
        status = determine_status(quantity)
        
        products.append({
            "Product Name": product_name,
            "Category": category,
            "Price": price,
            "Quantity": quantity,
            "Status": status,
        })
    
    return products


def main():
    """Generate Excel file with products for branch_id = 3"""
    print("Generating products for branch_id = 3...")
    
    # Generate products
    products = generate_products(num_products=50)
    
    # Create DataFrame
    df = pd.DataFrame(products)
    
    # Ensure columns are in the correct order
    df = df[["Product Name", "Category", "Price", "Quantity", "Status"]]
    
    # Save to Excel
    output_path = Path(__file__).parent / "products_branch3.xlsx"
    df.to_excel(output_path, index=False, engine='openpyxl')
    
    print(f"✅ Generated {len(products)} products")
    print(f"✅ Saved to: {output_path}")
    print(f"\n📊 Summary:")
    print(f"   - Categories: {df['Category'].nunique()}")
    print(f"   - In Stock: {(df['Status'] == 'In Stock').sum()}")
    print(f"   - Low Stock: {(df['Status'] == 'Low Stock').sum()}")
    print(f"   - Out of Stock: {(df['Status'] == 'Out of Stock').sum()}")
    print(f"\n✅ All products match validation requirements:")
    print(f"   ✓ Product Name: non-empty")
    print(f"   ✓ Category: matches database categories")
    print(f"   ✓ Price: > 0")
    print(f"   ✓ Quantity: >= 0")
    print(f"   ✓ Status: valid values")


if __name__ == "__main__":
    main()