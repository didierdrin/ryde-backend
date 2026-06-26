-- Seed "For Sale" vehicle listings (idempotent)

INSERT INTO auction_listings (listing_id, user_id, listing_type, title, description, make, model, year, price, image_url, status)
SELECT v.listing_id, seller.user_id, 'SELL'::auction_listing_type_enum, v.title, v.description, v.make, v.model, v.year, v.price, v.image_url, 'ACTIVE'::auction_status_enum
FROM (VALUES
    ('auction-seed-001', 'Toyota Land Cruiser TXL', 'Toyota', 'Land Cruiser TXL', 2021, 85000000.00,
     'https://res.cloudinary.com/dx0ujjtbb/image/upload/v1782464012/land-cruiser-txl_grzvjd.jpg',
     '2021 Toyota Land Cruiser TXL 4.5L V8 Diesel. 4x4, leather seats, sunroof, rear entertainment system, dual AC, and off-road package. Only 35,000 km driven. Excellent condition, full service history available.'),
    ('auction-seed-002', 'Hyundai Tucson', 'Hyundai', 'Tucson', 2020, 32000000.00,
     'https://res.cloudinary.com/dx0ujjtbb/image/upload/v1782464027/hyundai-tucson_whyfja.jpg',
     '2020 Hyundai Tucson 2.0L Premium. Petrol, automatic transmission, push-start, reverse camera, Apple CarPlay, and alloy wheels. Clean interior, well-maintained, 40,000 km mileage.'),
    ('auction-seed-003', 'Fenghao 3-Wheeler Cargo', 'Fenghao', '3-Wheeler Cargo', 2023, 4500000.00,
     'https://res.cloudinary.com/dx0ujjtbb/image/upload/v1782464007/fenghao-3wheeler_bcfijk.jpg',
     'Brand new 2023 Fenghao 3-wheeled cargo tuk-tuk. 200cc petrol engine, manual transmission, sturdy steel body, ideal for last-mile deliveries and small business transport. Includes spare tire.'),
    ('auction-seed-004', 'Toyota Camry Callister Edition', 'Toyota', 'Camry (Callister Edition)', 2019, 28500000.00,
     'https://res.cloudinary.com/dx0ujjtbb/image/upload/v1782464022/Toyota-sedan-callister_uyighg.jpg',
     '2019 Toyota Camry Callister Special Edition. 2.5L V6, automatic, keyless entry, leather upholstery, premium sound system, and 18-inch wheels. Very clean interior, single owner, 45,000 km driven.'),
    ('auction-seed-005', 'Toyota Prius', 'Toyota', 'Prius', 2021, 22000000.00,
     'https://res.cloudinary.com/dx0ujjtbb/image/upload/v1782464024/Toyota-Prius_vmc7q5.jpg',
     '2021 Toyota Prius Hybrid. 1.8L 4-cylinder with electric motor. Exceptional fuel economy (approx. 25 km/L). Features touchscreen infotainment, lane-keep assist, and adaptive cruise control. 30,000 km mileage.'),
    ('auction-seed-006', 'Toyota Corolla Hatchback', 'Toyota', 'Corolla Hatchback', 2020, 19500000.00,
     'https://res.cloudinary.com/dx0ujjtbb/image/upload/v1782464028/Toyota-hback_ho1ptc.jpg',
     '2020 Toyota Corolla Hatchback 1.8L. Petrol, CVT transmission, sport mode, rear spoiler, 7-inch display, and 16-inch alloys. Compact and perfect for city driving. 38,000 km, service records available.'),
    ('auction-seed-007', 'Toyota Sienna', 'Toyota', 'Sienna', 2019, 40000000.00,
     'https://res.cloudinary.com/dx0ujjtbb/image/upload/v1782464011/toyota-mini-van_hpdkcm.jpg',
     '2019 Toyota Sienna 7-seater Minivan. 3.5L V6, automatic sliding doors, leather seats, rear entertainment screen, and tri-zone climate control. Perfect for family trips. 50,000 km driven.'),
    ('auction-seed-008', 'Toyota Corolla', 'Toyota', 'Corolla', 2018, 16000000.00,
     'https://res.cloudinary.com/dx0ujjtbb/image/upload/v1782464019/toyota-sedan_coqqb5.jpg',
     '2018 Toyota Corolla 1.8L base sedan. Petrol, automatic, reliable daily driver with low maintenance costs. Features AC, power windows, and a basic audio system. Well-maintained, 60,000 km mileage.'),
    ('auction-seed-009', 'Hyundai Tucson GDI Premium', 'Hyundai', 'Tucson', 2022, 36500000.00,
     'https://res.cloudinary.com/dx0ujjtbb/image/upload/v1782464028/hyundai-suv_k0f3il.jpg',
     '2022 Hyundai Tucson 2.0L GDI Premium. Petrol, 8-speed automatic, panoramic sunroof, wireless charging, blind-spot monitoring, and 19-inch wheels. Like new condition, only 18,000 km mileage.')
) AS v(listing_id, title, make, model, year, price, image_url, description)
CROSS JOIN (
    SELECT user_id FROM users WHERE user_type = 'ADMIN' ORDER BY created_at LIMIT 1
) AS seller
WHERE seller.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auction_listings a WHERE a.listing_id = v.listing_id);
