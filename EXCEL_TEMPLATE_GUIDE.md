# Excel Template Guide for Product Import

## 📋 Overview
This guide explains how to modify the Excel template for importing products into the inventory system.

## 🎯 Current Template Structure

### Required Columns (Must be present in this exact order):
| Column Name | Data Type | Required | Description | Example |
|-------------|-----------|----------|-------------|---------|
| **Product Name** | Text | ✅ Yes | Name of the product | "LED Bulb 10W" |
| **Category** | Text | ✅ Yes | Product category (must match database) | "Bulb" or "Chandelier" |
| **Price** | Number | ✅ Yes | Product price (decimal allowed) | 299.99 |
| **Quantity** | Number | ✅ Yes | Stock quantity (whole number) | 100 |
| **Status** | Text | ✅ Yes | Stock status | "In Stock", "Low Stock", or "Out of Stock" |

### Sample Template Data:
```
| Product Name    | Category   | Price  | Quantity | Status    |
|-----------------|------------|--------|----------|-----------|
| LED Bulb 10W    | Bulb       | 299.99 | 100      | In Stock  |
| Smart Light     | Bulb       | 1299.99| 50       | In Stock  |
| Chandelier      | Chandelier | 4999.99| 5        | Low Stock |
```

## 🔧 How to Modify the Template

### 1. **Change Column Names**
To modify column names, update the `requiredColumns` array in `All_Stock.tsx`:

```typescript
// Current (line ~307)
const requiredColumns = ['Product Name', 'Category', 'Price', 'Quantity', 'Status'];

// Modified example
const requiredColumns = ['Product Name', 'Product Category', 'Unit Price', 'Stock Quantity', 'Stock Status'];
```

### 2. **Add New Columns**
To add new columns (e.g., Description, SKU):

#### Step 1: Update Required Columns
```typescript
const requiredColumns = ['Product Name', 'Category', 'Price', 'Quantity', 'Status', 'Description', 'SKU'];
```

#### Step 2: Update Data Processing
```typescript
// In the processing loop (around line ~365)
processedData.push({
  product_name: row['Product Name'],
  category_id: category.id,
  price: price,
  quantity: quantity,
  status: row['Status'],
  description: row['Description'] || '', // New field
  sku: row['SKU'] || '', // New field
  branch_id: branchId
});
```

#### Step 3: Update Database Schema
Add new columns to your `centralized_product` table in Supabase:
```sql
ALTER TABLE centralized_product 
ADD COLUMN description TEXT,
ADD COLUMN sku VARCHAR(50);
```

### 3. **Remove Columns**
To remove a column (e.g., remove Status):

#### Step 1: Update Required Columns
```typescript
const requiredColumns = ['Product Name', 'Category', 'Price', 'Quantity'];
```

#### Step 2: Update Data Processing
```typescript
processedData.push({
  product_name: row['Product Name'],
  category_id: category.id,
  price: price,
  quantity: quantity,
  // status: row['Status'], // Remove this line
  branch_id: branchId
});
```

### 4. **Change Data Validation Rules**

#### Modify Status Validation
```typescript
// Current (line ~347)
const validStatuses = ['In Stock', 'Out of Stock', 'Low Stock'];

// Modified example
const validStatuses = ['Available', 'Unavailable', 'Limited'];
```

#### Add Custom Validation
```typescript
// Add after price validation (around line ~340)
if (price > 10000) {
  errors.push(`Row ${rowNum}: Price cannot exceed 10,000`);
  continue;
}
```

### 5. **Update Template Download**
Modify the `handleDownloadTemplate` function (around line ~440):

```typescript
const templateData = [
  {
    'Product Name': 'LED Bulb 10W',
    'Category': categories[0]?.category_name || 'Sample Category',
    'Price': 299.99,
    'Quantity': 100,
    'Status': 'In Stock',
    'Description': 'Energy efficient LED bulb', // New field
    'SKU': 'LED-001' // New field
  },
  // ... more examples
];
```

## 📝 Common Modifications

### A. **Add Product Description**
```typescript
// 1. Add to required columns
const requiredColumns = ['Product Name', 'Category', 'Price', 'Quantity', 'Status', 'Description'];

// 2. Add to processed data
description: row['Description'] || '',

// 3. Update template
'Description': 'Energy efficient LED bulb'
```

### B. **Add SKU/Barcode**
```typescript
// 1. Add to required columns
const requiredColumns = ['Product Name', 'Category', 'Price', 'Quantity', 'Status', 'SKU'];

// 2. Add validation
if (!row['SKU']) {
  errors.push(`Row ${rowNum}: SKU is required`);
  continue;
}

// 3. Add to processed data
sku: row['SKU'],
```

### C. **Add Supplier Information**
```typescript
// 1. Add to required columns
const requiredColumns = ['Product Name', 'Category', 'Price', 'Quantity', 'Status', 'Supplier'];

// 2. Add to processed data
supplier: row['Supplier'] || 'Unknown',
```

## ⚠️ Important Notes

### 1. **Column Order Matters**
- Excel columns must match the `requiredColumns` array order
- Column names are case-sensitive in validation

### 2. **Database Schema**
- Any new fields must be added to the `centralized_product` table
- Update the Product interface in TypeScript

### 3. **Category Matching**
- Categories must exist in your database
- Use exact names or the system will try singular/plural matching

### 4. **Data Types**
- Price: Must be numeric (299.99)
- Quantity: Must be whole number (100)
- Status: Must match valid statuses exactly

## 🧪 Testing Your Changes

### 1. **Test Template Download**
```typescript
// Click "Download Template" button
// Verify new columns appear in downloaded file
```

### 2. **Test Import Validation**
```typescript
// Create test Excel file with new format
// Try importing to see validation messages
```

### 3. **Test Database Insert**
```typescript
// Verify data appears in database after import
// Check all new fields are populated correctly
```

## 🚨 Troubleshooting

### Common Issues:
1. **"Column not found"** → Check column name spelling and case
2. **"Category not found"** → Verify category exists in database
3. **"Invalid data type"** → Check Price/Quantity are numeric
4. **"Database error"** → Verify new columns exist in database schema

### Debug Steps:
1. Check browser console for detailed error messages
2. Verify database schema matches processed data structure
3. Test with small Excel file first
4. Check category names in database vs Excel file

## 📞 Support
If you need help modifying the template, check:
1. Browser console for error messages
2. Database schema in Supabase
3. Category names in your system
4. Excel file format and data types
