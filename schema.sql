-- Cloudflare D1 Schema for Car Rental Platform
-- Run this with: wrangler d1 execute car-rental-db --file=schema.sql

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS vehicles;

CREATE TABLE vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    daily_rate INTEGER NOT NULL,
    image_url TEXT,
    plate_number TEXT,
    description TEXT,
    features TEXT,
    is_available BOOLEAN DEFAULT 1
);

CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price INTEGER NOT NULL,
    status TEXT DEFAULT 'confirmed',
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Seed some demo vehicles
INSERT INTO vehicles (name, type, daily_rate, image_url, plate_number, description, features, is_available) VALUES
('Toyota Camry', 'Sedan', 45, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80', 'XYZ-1234', 'Reliable and fuel-efficient sedan, perfect for city driving and long highway trips.', '["5 Seats", "Auto", "Bluetooth", "AC"]', 1),
('Honda CR-V', 'SUV', 65, 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&q=80', 'ABC-9876', 'Spacious family SUV with ample cargo space and advanced safety features.', '["5 Seats", "Auto", "AWD", "Backup Camera"]', 1),
('Ford Mustang', 'Sports', 95, 'https://images.unsplash.com/photo-1584345604476-8ec5f452d1f2?w=600&q=80', 'FST-0001', 'Iconic American muscle car offering thrilling performance and head-turning styling.', '["4 Seats", "Manual", "V8 Engine", "Leather"]', 1),
('Tesla Model 3', 'Electric', 85, 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&q=80', 'EVC-7777', 'High-tech electric sedan with autopilot capabilities and a premium minimalist interior.', '["5 Seats", "Auto", "Electric", "Autopilot"]', 1),
('BMW X5', 'SUV', 120, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80', 'LXR-5555', 'Luxury SUV combining dynamic driving, premium comfort, and robust off-road capability.', '["5 Seats", "Auto", "AWD", "Sunroof"]', 1),
('Chevrolet Silverado', 'Truck', 75, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', 'TRK-9900', 'Heavy-duty pickup truck ready for tough jobs, hauling, and outdoor adventures.', '["6 Seats", "Auto", "4x4", "Towing Package"]', 1);
