-- Migration: Add images JSONB field to products table
-- This allows storing multiple images per product while maintaining backward compatibility

-- Add the new images field
ALTER TABLE products 
ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

-- Migrate existing image_url data to images array
-- Only update rows where image_url is not null or empty
UPDATE products 
SET images = jsonb_build_array(image_url) 
WHERE image_url IS NOT NULL AND image_url != '';

-- Add comment for documentation
COMMENT ON COLUMN products.images IS 'JSON array storing multiple image URLs for the product';

-- Optional: Add index for better query performance on images field
CREATE INDEX idx_products_images ON products USING GIN (images);

-- The image_url field is kept for backward compatibility
-- Applications can choose to use either field or both