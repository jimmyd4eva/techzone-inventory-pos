"""
TechZone POS - Data Import Script
=================================
Run this on your local machine to import production data.

Instructions:
1. Make sure MongoDB is running locally (mongod)
2. Run: python IMPORT_TO_LOCAL.py

This will import: inventory, customers, users, sales, repairs, coupons, settings
"""

from pymongo import MongoClient

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

# ============ INVENTORY DATA ============
INVENTORY_DATA = [
  {
    "_id": "698763d909213a67dc1f8fd1",
    "id": "87b3ea22-ab65-4be0-9a1a-4fb2f6d29052",
    "name": "iPhone XR Screen",
    "type": "Screen",
    "sku": "IPXR-SCR-001",
    "quantity": 6,
    "cost_price": 45.0,
    "selling_price": 90.0,
    "supplier": "Tech Parts Inc",
    "low_stock_threshold": 1,
    "created_at": "2025-10-17T19:13:35.667453+00:00",
    "image_url": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-xr-new.jpg",
    "barcode": "IPHXR-SCR-001",
    "gsm_arena_url": "https://www.gsmarena.com/apple_iphone_xr-9320.php",
    "gsmarena_url": "https://www.gsmarena.com/apple_iphone_xr-9320.php"
  },
  {
    "_id": "698763d909213a67dc1f8fd2",
    "id": "b532fa64-c570-4ede-bf18-5c9e1bbcd131",
    "name": "Samsung Galaxy S21",
    "type": "phone",
    "sku": "SGS21-001",
    "quantity": 6,
    "cost_price": 400.0,
    "selling_price": 650.0,
    "supplier": "Rainbow Electronics",
    "low_stock_threshold": 3,
    "created_at": "2025-10-17T19:13:35.667469+00:00",
    "image_url": "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s21-5g-0.jpg",
    "gsm_arena_url": "https://www.gsmarena.com/samsung_galaxy_s21_5g-10626.php"
  },
  {
    "_id": "698763d909213a67dc1f8fd3",
    "id": "5a2d8580-1a22-4f8a-a112-cd8e36a9366c",
    "name": "SAMSUNG AO3 CORE",
    "type": "part",
    "sku": "SM-A03C",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 9,
    "cost_price": 850.0,
    "selling_price": 3500.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 3,
    "created_at": "2025-11-06T22:16:04.791872+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fd4",
    "id": "d5f44f1c-2570-4c59-a8f5-84ad489c3c53",
    "name": "SAMSUNG A02S(A04E)",
    "type": "part",
    "sku": "SM-A2S-4E",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 5,
    "cost_price": 850.0,
    "selling_price": 3500.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 3,
    "created_at": "2025-11-06T22:19:02.444631+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fd5",
    "id": "ec05cbea-7f46-4e99-b46b-f4432b927366",
    "name": "SAMSUNG A03",
    "type": "part",
    "sku": "SM-03",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 8,
    "cost_price": 850.0,
    "selling_price": 3499.99,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 3,
    "created_at": "2025-11-06T22:21:02.230181+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fd6",
    "id": "13d0e202-d226-4819-8263-562b65bd2e3f",
    "name": "SAM-A04",
    "type": "part",
    "sku": "SM-04",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 8,
    "cost_price": 850.0,
    "selling_price": 3500.0,
    "supplier": "CANDICE CHINA",
    "low_stock_threshold": 3,
    "created_at": "2025-11-06T22:22:16.698642+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fd7",
    "id": "3fedb70a-862b-4d79-bb41-b6abbeaecd28",
    "name": "SAM-05",
    "type": "part",
    "sku": "SM+05",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 18,
    "cost_price": 900.0,
    "selling_price": 4000.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 5,
    "created_at": "2025-11-06T22:24:35.916971+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fd8",
    "id": "534c247a-e948-4534-bb3b-00b8d1d19d8c",
    "name": "Car Charger",
    "type": "other",
    "sku": "C-Char1",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 4,
    "cost_price": 400.0,
    "selling_price": 1500.0,
    "supplier": "Peter Phone shop",
    "low_stock_threshold": 2,
    "created_at": "2025-11-06T22:25:36.969144+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fd9",
    "id": "0614ddd9-8517-41fc-a30d-1d94da9298d9",
    "name": "SM-A047",
    "type": "part",
    "sku": "SM-04S",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 14,
    "cost_price": 800.0,
    "selling_price": 4000.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 3,
    "created_at": "2025-11-06T22:28:58.701729+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fda",
    "id": "29fd2417-2d1d-4336-8f55-666c7de37e6c",
    "name": "SAM-A10",
    "type": "part",
    "sku": "SM-10",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 5,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 2,
    "created_at": "2025-11-06T22:30:40.132947+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fdb",
    "id": "9616b758-6038-47b9-a04e-2ea0be87a68d",
    "name": "SAM-A20",
    "type": "part",
    "sku": "SM-20",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 4,
    "cost_price": 500.0,
    "selling_price": 4000.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 2,
    "created_at": "2025-11-06T22:32:16.969778+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fdc",
    "id": "b38acc47-fa45-498c-bc9b-cb1130c6b415",
    "name": "SAM-A11 BIG",
    "type": "part",
    "sku": "SM-A11B",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 4,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 2,
    "created_at": "2025-11-06T22:55:54.540038+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fdd",
    "id": "a091ec21-06a1-47d7-b540-22d30ec95064",
    "name": "SAM-A11 SMALL",
    "type": "part",
    "sku": "SM-A11-S",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 3,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 2,
    "created_at": "2025-11-06T22:58:33.972342+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fde",
    "id": "06b3f103-6f82-44e7-addb-eec50a70ae31",
    "name": "SAM-A12-F12-UNIVERSAL",
    "type": "part",
    "sku": "SM-A12-F12UNI",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 16,
    "cost_price": 800.0,
    "selling_price": 3500.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 5,
    "created_at": "2025-11-06T23:00:56.177266+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fdf",
    "id": "5caf4251-9c18-44eb-a7ab-9645581433c9",
    "name": "SAM-A13/23(M336)",
    "type": "part",
    "sku": "SM-13-23-M336",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 19,
    "cost_price": 900.0,
    "selling_price": 3500.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 5,
    "created_at": "2025-11-06T23:03:09.562412+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fe0",
    "id": "9ea7ce5d-4a6f-4db3-9007-2b006f422dfb",
    "name": "SAM-A145F (A14-4G)",
    "type": "phone",
    "sku": "SM-14-4G",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 10,
    "cost_price": 900.0,
    "selling_price": 4000.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 3,
    "created_at": "2025-11-06T23:05:42.446768+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fe1",
    "id": "52b4bbdd-d715-459d-a0e7-4c6802e29326",
    "name": "SAM-A146B (A14 5G)",
    "type": "part",
    "sku": "SM-14-5G",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 17,
    "cost_price": 900.0,
    "selling_price": 4000.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 3,
    "created_at": "2025-11-06T23:07:23.007196+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fe2",
    "id": "597c6a52-adb4-420c-9830-6c609cbb8552",
    "name": "SAM-A15 INCELL IN FRAME",
    "type": "part",
    "sku": "SM-15-WF",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 0,
    "cost_price": 1000.0,
    "selling_price": 6000.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 2,
    "created_at": "2025-11-06T23:10:08.166273+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fe3",
    "id": "dacb9fb3-3267-4b01-a948-86a2de6cb3df",
    "name": "SAM-A15 NO FRAME",
    "type": "part",
    "sku": "SM-A15NF",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 10,
    "cost_price": 1008.0,
    "selling_price": 5000.0,
    "supplier": "CANDICE CHINA LADY",
    "low_stock_threshold": 3,
    "created_at": "2025-11-06T23:12:23.527657+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fe4",
    "id": "f61f7739-16b1-4eca-8ea2-3eaaa72a0314",
    "name": "SM-A03(A04E/02S SMALL)",
    "type": "part",
    "sku": "SM-03-4E-2SSM",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 4,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": "kYLE CHINA MAN",
    "low_stock_threshold": 3,
    "created_at": "2025-11-07T16:12:09.419022+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fe5",
    "id": "875aa90c-8f6d-46b4-83ec-5b6d94793bdc",
    "name": "SM-A057(A05S)",
    "type": "part",
    "sku": "SM-05s",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 3,
    "cost_price": 500.0,
    "selling_price": 4000.0,
    "supplier": "CANDICE CHINA",
    "low_stock_threshold": 2,
    "created_at": "2025-11-07T16:25:17.702932+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fe6",
    "id": "a9e8eb6a-a3ad-4f79-861f-551ac629b610",
    "name": "SM-A037",
    "type": "part",
    "sku": "SM-A03s",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 6,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": "KYLE CHINA MAN",
    "low_stock_threshold": 3,
    "created_at": "2025-11-07T18:09:19.557083+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fe7",
    "id": "761a1d21-3357-4fa9-b98e-b1db7c7012ee",
    "name": "Samsung-A21",
    "type": "part",
    "sku": "SM-A21",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 5,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": "Kyle china",
    "low_stock_threshold": 2,
    "created_at": "2025-11-10T22:59:41.043520+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fe8",
    "id": "6455a9b3-6f24-4cb0-afb7-9d532c8a7f91",
    "name": "Samsung A16 4G Sub Board",
    "type": "part",
    "sku": "SM_A16-4G-SB",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 4,
    "cost_price": 300.0,
    "selling_price": 2000.0,
    "supplier": "Kyle china",
    "low_stock_threshold": 2,
    "created_at": "2025-11-10T23:02:32.194757+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fe9",
    "id": "2ac4e7eb-98d3-4358-a702-fe6a61429a38",
    "name": "Samsung A05",
    "type": "part",
    "sku": "SM-05",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 18,
    "cost_price": 500.0,
    "selling_price": 4000.0,
    "supplier": "kyle china ",
    "low_stock_threshold": 5,
    "created_at": "2025-11-11T16:42:01.989833+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fea",
    "id": "6b65e602-c3f8-4b37-b3de-79250c0104e5",
    "name": "Samsung A-217",
    "type": "part",
    "sku": "SM-A21s",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 2,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": "Kyle china",
    "low_stock_threshold": 2,
    "created_at": "2025-11-11T18:46:24.931251+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8feb",
    "id": "24fd2acc-ec35-4aef-8756-04d936202900",
    "name": "Iphone 16 Pro Max clear case",
    "type": "accessory",
    "sku": "IP-16PM-CC",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 2,
    "cost_price": 500.0,
    "selling_price": 2000.0,
    "supplier": "Mr. Hoe",
    "low_stock_threshold": 1,
    "created_at": "2025-11-11T18:50:19.666963+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fec",
    "id": "ab0eb945-f4d4-49f1-8c45-2ca39da850af",
    "name": "Iphone 16 Pro Max Case-NF Green",
    "type": "accessory",
    "sku": "IP-16Pro Max NF-G",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 1,
    "cost_price": 500.0,
    "selling_price": 2000.0,
    "supplier": "Mr. hoe",
    "low_stock_threshold": 1,
    "created_at": "2025-11-11T18:52:49.640758+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fed",
    "id": "86ff16ab-2892-4101-888f-708512b0eb52",
    "name": "USB Cable",
    "type": "other",
    "sku": "USB-001",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 50,
    "cost_price": 2.5,
    "selling_price": 5.99,
    "supplier": "Cable Supplies Inc",
    "low_stock_threshold": 10,
    "created_at": "2025-11-12T19:08:03.008288+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fee",
    "id": "dcb24ebb-7b4e-4492-9323-9fb6d4a2386b",
    "name": "Vehicle Phone holder",
    "type": "other",
    "sku": "VPH-1",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 4,
    "cost_price": 450.0,
    "selling_price": 1500.0,
    "supplier": "Peter Phone shop",
    "low_stock_threshold": 2,
    "created_at": "2025-11-12T19:17:39.732369+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fef",
    "id": "3d0b8e3d-5d64-4984-a9bb-206029c941eb",
    "name": "Test Item",
    "type": "other",
    "sku": "TEST-001",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 10,
    "cost_price": 5.0,
    "selling_price": 10.0,
    "supplier": "",
    "low_stock_threshold": 10,
    "created_at": "2025-11-12T20:24:15.253920+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ff0",
    "id": "0deb9119-f698-486d-987d-9931da29bcc1",
    "name": "Test Item",
    "type": "other",
    "sku": "TEST-001",
    "barcode": null,
    "image_url": null,
    "gsm_arena_url": null,
    "quantity": 10,
    "cost_price": 5.0,
    "selling_price": 10.0,
    "supplier": null,
    "low_stock_threshold": 10,
    "created_at": "2025-11-12T20:25:27.920858+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ff1",
    "id": "571b0c40-e21f-43af-b078-5fa027c06faf",
    "name": "Samsung A06",
    "type": "part",
    "sku": "SM-06",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 8,
    "cost_price": 500.0,
    "selling_price": 4000.0,
    "supplier": "Kyl China",
    "low_stock_threshold": 3,
    "created_at": "2025-11-12T21:13:17.146190+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ff2",
    "id": "e77916a3-e5a2-48e1-9a6e-cfa12c2dca1d",
    "name": "LG STYLO 6",
    "type": "part",
    "sku": "LG-Q730",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 4,
    "cost_price": 600.0,
    "selling_price": 5999.99,
    "supplier": "kYLE CHINA",
    "low_stock_threshold": 1,
    "created_at": "2025-11-18T15:15:36.747747+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ff3",
    "id": "b2df785a-0026-49fb-927c-45d27f5efb36",
    "name": "ZTE BLADE A35E",
    "type": "part",
    "sku": "ZTE-A35E",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 4,
    "cost_price": 500.0,
    "selling_price": 4999.99,
    "supplier": "KYLE CHINA",
    "low_stock_threshold": 2,
    "created_at": "2025-11-18T15:16:30.913057+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ff4",
    "id": "d61f2cbf-b76b-478b-a756-159c68e5dd12",
    "name": "Samsung A52 Oled in Frame",
    "type": "part",
    "sku": "SM-52-Oled-IF",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 1,
    "cost_price": 5000.0,
    "selling_price": 12000.0,
    "supplier": "Candice China",
    "low_stock_threshold": 1,
    "created_at": "2025-11-18T23:35:23.939370+00:00"
  },
  {
    "_id": "69876e171ea5dd02d748c7ab",
    "id": "15782fca-cb10-4546-9a17-8d5c6e88f1fa",
    "name": "Report Test iPhone",
    "type": "phone",
    "sku": "RPT-PHONE-001",
    "barcode": null,
    "image_url": null,
    "gsm_arena_url": null,
    "quantity": 98,
    "cost_price": 800.0,
    "selling_price": 1000.0,
    "supplier": null,
    "low_stock_threshold": 10,
    "created_at": "2026-02-07T16:53:43.414574+00:00"
  },
  {
    "_id": "69876e171ea5dd02d748c7ac",
    "id": "aea4aa78-fe2c-4a84-ac4c-eff297eaff7b",
    "name": "Report Test Screen",
    "type": "screen",
    "sku": "RPT-SCREEN-001",
    "barcode": null,
    "image_url": null,
    "gsm_arena_url": null,
    "quantity": 98,
    "cost_price": 50.0,
    "selling_price": 100.0,
    "supplier": null,
    "low_stock_threshold": 10,
    "created_at": "2026-02-07T16:53:43.458250+00:00"
  },
  {
    "_id": "69876e171ea5dd02d748c7ad",
    "id": "5f8fe7d8-ee78-4c42-ab10-1d9e348074da",
    "name": "Report Test Part",
    "type": "part",
    "sku": "RPT-PART-001",
    "barcode": null,
    "image_url": null,
    "gsm_arena_url": null,
    "quantity": 98,
    "cost_price": 20.0,
    "selling_price": 40.0,
    "supplier": null,
    "low_stock_threshold": 10,
    "created_at": "2026-02-07T16:53:43.500354+00:00"
  },
  {
    "_id": "69876e171ea5dd02d748c7ae",
    "id": "8edc7a76-a8fe-418e-87d3-fcb484aac066",
    "name": "Report Test Accessory",
    "type": "accessory",
    "sku": "RPT-ACC-001",
    "barcode": null,
    "image_url": null,
    "gsm_arena_url": null,
    "quantity": 97,
    "cost_price": 5.0,
    "selling_price": 15.0,
    "supplier": null,
    "low_stock_threshold": 10,
    "created_at": "2026-02-07T16:53:43.584439+00:00"
  },
  {
    "_id": "698cd2884c4473b6e7f7eaab",
    "id": "cc60f5d8-b69d-4c00-9d28-40b285a0df69",
    "name": "SAMSUNG S23 ULTRA",
    "type": "part",
    "sku": "SM-S23U",
    "barcode": "",
    "image_url": "",
    "gsm_arena_url": "",
    "quantity": 2,
    "cost_price": 8000.0,
    "selling_price": 21000.0,
    "supplier": "kYLE",
    "low_stock_threshold": 1,
    "created_at": "2026-02-11T19:03:36.847576+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b5f",
    "id": "4c089629-c8d0-4bfd-83ad-62ec4f75ee95",
    "name": "Samsung Galaxy S21 5G",
    "type": "phone",
    "sku": "SM-S21-5G",
    "barcode": null,
    "image_url": "https://fdn2.gsmarena.com/vv/pics/samsung/samsung-galaxy-s21-5g-0.jpg",
    "gsm_arena_url": null,
    "quantity": 2,
    "cost_price": 25000.0,
    "selling_price": 35000.0,
    "supplier": null,
    "low_stock_threshold": 1,
    "created_at": "2026-02-11T19:27:15.429454+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b60",
    "id": "430e598d-90d9-4048-8327-f6038ed47dff",
    "name": "SAM-A146B-5G",
    "type": "phone",
    "sku": "SM-14B-5G",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/thumbs/images/g/GVAAAOSwRexnXXgz/s-l300.webp",
    "gsm_arena_url": null,
    "quantity": 13,
    "cost_price": 900.0,
    "selling_price": 4000.0,
    "supplier": null,
    "low_stock_threshold": 3,
    "created_at": "2026-02-11T19:27:15.467834+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b61",
    "id": "6ba67789-d8be-42bb-ad69-b5ca20f3ff7c",
    "name": "SAM-A145FB (A14 4G)",
    "type": "part",
    "sku": "SM-145-4G",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/ewYAAOSwgg9oKcJm/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 10,
    "cost_price": 900.0,
    "selling_price": 4000.0,
    "supplier": null,
    "low_stock_threshold": 3,
    "created_at": "2026-02-11T19:27:15.505842+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b62",
    "id": "6c78861f-8722-4674-84ed-d4fcb041f15e",
    "name": "SAM-A15 5G INCELL IN FRAME",
    "type": "part",
    "sku": "SM-15-5G-WF",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/APwAAOSwIYVoQ7KJ/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 4,
    "cost_price": 1000.0,
    "selling_price": 7000.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:15.541954+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b63",
    "id": "37af6b00-40c2-402d-ab3a-fe14b8572f98",
    "name": "SM-A057",
    "type": "part",
    "sku": "SM-05s",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/thumbs/images/g/WVAAAOSwEYRmLiVV/s-l300.webp",
    "gsm_arena_url": null,
    "quantity": 3,
    "cost_price": 500.0,
    "selling_price": 4000.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:15.574647+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b64",
    "id": "52582e09-cac8-42f7-8cc9-ea6aa0b98ecf",
    "name": "Samsung A16 5G",
    "type": "part",
    "sku": "SM_A16-5G-IF",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/GaYAAOSw~Gln8X8f/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 4,
    "cost_price": 300.0,
    "selling_price": 2000.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:15.608262+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b65",
    "id": "feec64f0-1d5d-48e5-bd33-586661b97a29",
    "name": "Samsung Note 9 Oled LCD",
    "type": "part",
    "sku": "SM-N9-OL",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/i6wAAOSwFYFmUDW0/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 1,
    "cost_price": 8000.0,
    "selling_price": 18000.0,
    "supplier": null,
    "low_stock_threshold": 1,
    "created_at": "2026-02-11T19:27:15.640856+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b66",
    "id": "a155a2ce-caed-4fa4-b77b-83882ebce90f",
    "name": "SAMSUNG S23ULTRA OLED",
    "type": "part",
    "sku": "SM-23U-OL",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/v5wAAOSwywVnRgGk/s-l960.webp",
    "gsm_arena_url": null,
    "quantity": 2,
    "cost_price": 10000.0,
    "selling_price": 22000.0,
    "supplier": null,
    "low_stock_threshold": 1,
    "created_at": "2026-02-11T19:27:15.674602+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b67",
    "id": "5a6ee159-c5ce-4eb5-abdb-17d2b6584916",
    "name": "SAMSUNG S22 ULTRA",
    "type": "part",
    "sku": "SM-S22U-OL",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/FwIAAeSwZzdpIblm/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 2,
    "cost_price": 9000.0,
    "selling_price": 20000.0,
    "supplier": null,
    "low_stock_threshold": 1,
    "created_at": "2026-02-11T19:27:15.708789+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b68",
    "id": "352e485b-db35-426c-b0d7-5837d6ef3116",
    "name": "SAMSUNG NOTE10 PLUS",
    "type": "part",
    "sku": "SM-N975U",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/1fwAAOSw~ldneaFT/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 2,
    "cost_price": 10000.0,
    "selling_price": 20000.0,
    "supplier": null,
    "low_stock_threshold": 1,
    "created_at": "2026-02-11T19:27:15.744399+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b69",
    "id": "30abb64c-219f-4cf9-b532-69eaec4f4bc7",
    "name": "SAMSUNG N20 PLUS",
    "type": "part",
    "sku": "SM-G986",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/4XAAAeSwKqZoIS2n/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 2,
    "cost_price": 10000.0,
    "selling_price": 22000.0,
    "supplier": null,
    "low_stock_threshold": 1,
    "created_at": "2026-02-11T19:27:15.786603+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b6a",
    "id": "f6ea9116-6337-4826-b0cf-4b092b2f0d94",
    "name": "SAMSUNG S24 ULTRA",
    "type": "part",
    "sku": "SM-S928U",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/5zYAAOSwtaRoUtmu/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 2,
    "cost_price": 10000.0,
    "selling_price": 22000.0,
    "supplier": null,
    "low_stock_threshold": 1,
    "created_at": "2026-02-11T19:27:15.823583+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b6b",
    "id": "99f2340d-212a-4808-b149-32290a1fac20",
    "name": "smart watch",
    "type": "phone",
    "sku": "SM-W",
    "barcode": null,
    "image_url": "https://fdn2.gsmarena.com/vv/pics/itel/itel-smart-watch-1.jpg",
    "gsm_arena_url": null,
    "quantity": 4,
    "cost_price": 500.0,
    "selling_price": 6000.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:15.864461+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b6c",
    "id": "57883de2-8a56-456d-91e9-2518e2a40927",
    "name": "Samsung A04e",
    "type": "part",
    "sku": "SM-4E",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/thumbs/images/g/cFEAAOSwgppmuCW1/s-l300.webp",
    "gsm_arena_url": null,
    "quantity": 8,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:15.901357+00:00"
  },
  {
    "_id": "698cd813e8b16807355c0b6d",
    "id": "ceeb4e3d-10b6-4359-98ab-06fbb9309e80",
    "name": "Samsung A30s Oled",
    "type": "part",
    "sku": "SM-A307",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/eaMAAOSwtzxoHJoO/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 4,
    "cost_price": 500.0,
    "selling_price": 5000.0,
    "supplier": null,
    "low_stock_threshold": 1,
    "created_at": "2026-02-11T19:27:15.977293+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b6e",
    "id": "64680cc5-9dcf-4f08-8bd7-efb01f93e23e",
    "name": "Samsung A20s",
    "type": "part",
    "sku": "SM-A207",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/~NsAAeSwfS1owKdj/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 4,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:16.014406+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b6f",
    "id": "6c56934d-b03e-4071-8289-2bd9e8ab9e00",
    "name": "Samsung A13 4G",
    "type": "part",
    "sku": "SM-A135F",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 3,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:16.050373+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b70",
    "id": "fee325e8-1f42-4613-a3ac-1adb9fda3681",
    "name": "iPhone Lightening - C-2M",
    "type": "accessory",
    "sku": "IP-L-C-2M",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/BfgAAeSwrvFo-P4l/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 4,
    "cost_price": 250.0,
    "selling_price": 1000.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:16.089596+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b71",
    "id": "408f9fab-71bf-4a8b-960d-c2fcec748724",
    "name": "CR2032 Battery",
    "type": "accessory",
    "sku": "CR-2032",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/v5kAAeSw3lxpEFer/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 49,
    "cost_price": 100.0,
    "selling_price": 300.0,
    "supplier": null,
    "low_stock_threshold": 5,
    "created_at": "2026-02-11T19:27:16.129522+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b72",
    "id": "6b41f4d0-c0de-4246-aa8a-b9c621baf33f",
    "name": "PK Cell CR1632",
    "type": "accessory",
    "sku": "PKC-1632",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/KlwAAOSwJBdeEojj/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 50,
    "cost_price": 100.0,
    "selling_price": 300.0,
    "supplier": null,
    "low_stock_threshold": 5,
    "created_at": "2026-02-11T19:27:16.168662+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b73",
    "id": "655266c8-c4a5-478f-8b0e-3e02957d5c6a",
    "name": "Nightkonic CR2025",
    "type": "accessory",
    "sku": "NK-2025",
    "barcode": null,
    "image_url": "https://ledstuff.co.nz/pub/media/catalog/product/cache/c9e0b0ef589f3508e5ba515cde53c5ff/l/e/led-bcr2025-01_1.jpg",
    "gsm_arena_url": null,
    "quantity": 20,
    "cost_price": 100.0,
    "selling_price": 300.0,
    "supplier": null,
    "low_stock_threshold": 5,
    "created_at": "2026-02-11T19:27:16.207889+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b74",
    "id": "dd3ba0dc-701c-4f51-8f4b-346aff60c2e4",
    "name": "AAA Battery HUAYUNOK",
    "type": "accessory",
    "sku": "3A-BAT-HU",
    "barcode": null,
    "image_url": "https://www.topflix.gr/wp-content/uploads/2024/11/146030.jpg",
    "gsm_arena_url": null,
    "quantity": 27,
    "cost_price": 100.0,
    "selling_price": 300.0,
    "supplier": null,
    "low_stock_threshold": 4,
    "created_at": "2026-02-11T19:27:16.244208+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b75",
    "id": "500ad7de-8551-4923-8d95-79efa3c6394b",
    "name": "Fast charge base-white",
    "type": "accessory",
    "sku": "FC-Base",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/IYsAAOSwzNxhBZdP/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 9,
    "cost_price": 250.0,
    "selling_price": 1000.0,
    "supplier": null,
    "low_stock_threshold": 3,
    "created_at": "2026-02-11T19:27:16.279374+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b76",
    "id": "c1c620b6-2b9f-47e8-82dd-75b143d0c550",
    "name": "Type C-USB QHTF 6A",
    "type": "accessory",
    "sku": "TC-USB-6A",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/fJsAAeSwe61o0AU-/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 7,
    "cost_price": 200.0,
    "selling_price": 1000.0,
    "supplier": null,
    "low_stock_threshold": 3,
    "created_at": "2026-02-11T19:27:16.314651+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b77",
    "id": "52c2add0-f27f-4f84-8ffb-3a93111a3077",
    "name": "Micro usb QHTF",
    "type": "accessory",
    "sku": "M-usb-w",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/XMkAAOSwwHRmF05p/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 9,
    "cost_price": 180.0,
    "selling_price": 700.0,
    "supplier": null,
    "low_stock_threshold": 3,
    "created_at": "2026-02-11T19:27:16.348400+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b78",
    "id": "18d239d0-2231-49b5-a1d6-67019d3b04bd",
    "name": "Type-C Base-White",
    "type": "accessory",
    "sku": "T-CB-W",
    "barcode": null,
    "image_url": "https://m.media-amazon.com/images/I/414P85fLFRL._AC_SL1500_.jpg",
    "gsm_arena_url": null,
    "quantity": 5,
    "cost_price": 450.0,
    "selling_price": 1500.0,
    "supplier": null,
    "low_stock_threshold": 3,
    "created_at": "2026-02-11T19:27:16.388076+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b79",
    "id": "3689fdb4-1379-458a-858c-4ae283ecc11b",
    "name": "AA Battery",
    "type": "accessory",
    "sku": "AA-Bat",
    "barcode": null,
    "image_url": "https://www.topflix.gr/wp-content/uploads/2024/11/146030.jpg",
    "gsm_arena_url": null,
    "quantity": 18,
    "cost_price": 100.0,
    "selling_price": 300.0,
    "supplier": null,
    "low_stock_threshold": 4,
    "created_at": "2026-02-11T19:27:16.427435+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b7a",
    "id": "f2324959-1152-419f-8936-9c516ca5d841",
    "name": "C-C USB WHITE",
    "type": "accessory",
    "sku": "C-C",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/s6oAAeSwMbdo1wiI/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 8,
    "cost_price": 200.0,
    "selling_price": 1000.0,
    "supplier": null,
    "low_stock_threshold": 3,
    "created_at": "2026-02-11T19:27:16.466170+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b7b",
    "id": "415b81fd-25c8-4609-a55d-5c3735dea6b1",
    "name": "Lightening-C 1M",
    "type": "accessory",
    "sku": "L-C-1M",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/GMIAAeSwK6lo1wV4/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 9,
    "cost_price": 180.0,
    "selling_price": 1000.0,
    "supplier": null,
    "low_stock_threshold": 3,
    "created_at": "2026-02-11T19:27:16.500732+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b7c",
    "id": "4c7f81a4-5745-49a2-b0f7-a487196d3781",
    "name": "Samsung A136U",
    "type": "phone",
    "sku": "SM-A13 5G",
    "barcode": null,
    "image_url": "https://i.ebayimg.com/images/g/ebUAAOSwPFJiaRgS/s-l1600.webp",
    "gsm_arena_url": null,
    "quantity": 8,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": null,
    "low_stock_threshold": 3,
    "created_at": "2026-02-11T19:27:16.537529+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b7d",
    "id": "9f651fd8-41fd-43ac-a321-f2f61bef7d70",
    "name": "Samsung A236u",
    "type": "part",
    "sku": "SM-A23 5G",
    "barcode": null,
    "image_url": "Samsung A236",
    "gsm_arena_url": null,
    "quantity": 6,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": null,
    "low_stock_threshold": -2,
    "created_at": "2026-02-11T19:27:16.573595+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b7e",
    "id": "54a2f5c6-541e-448c-89e2-72922e9e7a3c",
    "name": "TWS earbuds",
    "type": "accessory",
    "sku": "MZ-AP3",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 3,
    "cost_price": 850.0,
    "selling_price": 3499.96,
    "supplier": null,
    "low_stock_threshold": 1,
    "created_at": "2026-02-11T19:27:16.605209+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b7f",
    "id": "92a652e7-1043-49e7-92e0-67d6584d383d",
    "name": "Digicel Sim to Go Card",
    "type": "other",
    "sku": "Digi-SG-Card",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 4,
    "cost_price": 150.0,
    "selling_price": 750.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:16.682039+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b80",
    "id": "dbd63ea6-ab99-4f7b-9c9d-bfab0b4f8564",
    "name": "Iphone USB lighten",
    "type": "accessory",
    "sku": "IP-120W-USB",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 3,
    "cost_price": 150.0,
    "selling_price": 700.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:16.721378+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b81",
    "id": "4f2fd5f9-d7a4-4bb9-8a39-cb54f76bd1fe",
    "name": "Iphone Type C-Lightening",
    "type": "accessory",
    "sku": "IP-120W-C-L",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 6,
    "cost_price": 150.0,
    "selling_price": 700.0,
    "supplier": null,
    "low_stock_threshold": -3,
    "created_at": "2026-02-11T19:27:16.759065+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b82",
    "id": "aea75cfa-e489-4796-a079-87b2441b4c36",
    "name": "Iphone lightning Super Charge",
    "type": "phone",
    "sku": "IP-L-S-C",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 10,
    "cost_price": 150.0,
    "selling_price": 700.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:16.794091+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b83",
    "id": "5fc8d9df-b17f-49f0-93df-93ea4a323f3c",
    "name": "Iphone 13 Pro Max GX Oled",
    "type": "part",
    "sku": "IP-13PM-GX-OLED",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 2,
    "cost_price": 7000.0,
    "selling_price": 12000.0,
    "supplier": null,
    "low_stock_threshold": -3,
    "created_at": "2026-02-11T19:27:16.830946+00:00"
  },
  {
    "_id": "698cd814e8b16807355c0b84",
    "id": "ef677c9b-e25c-4775-a850-d8243fa7486a",
    "name": "Iphone LIghtning Ear Phone",
    "type": "accessory",
    "sku": "IP-L-EP",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 4,
    "cost_price": 200.0,
    "selling_price": 1500.0,
    "supplier": null,
    "low_stock_threshold": 1,
    "created_at": "2026-02-11T19:27:16.865929+00:00"
  },
  {
    "_id": "698cd817e8b16807355c0b85",
    "id": "421565f2-8350-4e1e-b6a8-5fd6f6e74098",
    "name": "Samsung Ear Phone",
    "type": "accessory",
    "sku": "S5-E-Ph-Blk",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 8,
    "cost_price": 200.0,
    "selling_price": 500.0,
    "supplier": null,
    "low_stock_threshold": 3,
    "created_at": "2026-02-11T19:27:19.961296+00:00"
  },
  {
    "_id": "698cd823e8b16807355c0b86",
    "id": "e5ccac46-a0b9-42e7-8edb-25c87aa13b26",
    "name": "Samsung Ear Phone",
    "type": "accessory",
    "sku": "S5-E-Ph-White",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 9,
    "cost_price": 200.0,
    "selling_price": 500.0,
    "supplier": null,
    "low_stock_threshold": -2,
    "created_at": "2026-02-11T19:27:31.221705+00:00"
  },
  {
    "_id": "698cd823e8b16807355c0b87",
    "id": "c06722c7-cbec-4357-a9ab-2ca685af8661",
    "name": "Samsung A10s",
    "type": "part",
    "sku": "Sam-A10s",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 4,
    "cost_price": 500.0,
    "selling_price": 3500.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:31.275535+00:00"
  },
  {
    "_id": "698cd823e8b16807355c0b88",
    "id": "3213fbad-8f17-4811-933e-b1c8dd54eda6",
    "name": "Samsung A32 4G",
    "type": "phone",
    "sku": "S-A32-4G",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 4,
    "cost_price": 1500.0,
    "selling_price": 6999.99,
    "supplier": null,
    "low_stock_threshold": -2,
    "created_at": "2026-02-11T19:27:31.314644+00:00"
  },
  {
    "_id": "698cd823e8b16807355c0b89",
    "id": "7e014d3d-c1d2-4853-a2ab-5d72346faf90",
    "name": "HDMI Cable 3M",
    "type": "accessory",
    "sku": "HD-C-3M",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 4,
    "cost_price": 500.0,
    "selling_price": 1800.0,
    "supplier": null,
    "low_stock_threshold": -1,
    "created_at": "2026-02-11T19:27:31.352374+00:00"
  },
  {
    "_id": "698cd823e8b16807355c0b8a",
    "id": "a8ee560a-77fa-4fcf-a1b2-127977bbd536",
    "name": "Iphone Base ",
    "type": "accessory",
    "sku": "IPH-B-Reg",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 8,
    "cost_price": 300.0,
    "selling_price": 1000.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:31.688421+00:00"
  },
  {
    "_id": "698cd823e8b16807355c0b8b",
    "id": "6216d57a-5d70-4d52-8cee-2200310ff8a3",
    "name": "Samsung A07",
    "type": "part",
    "sku": "Sm-07",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 9,
    "cost_price": 600.0,
    "selling_price": 4000.0,
    "supplier": null,
    "low_stock_threshold": 2,
    "created_at": "2026-02-11T19:27:31.722600+00:00"
  },
  {
    "_id": "698cd823e8b16807355c0b8c",
    "id": "309da0ee-b61d-44b8-bcc8-4f5f32efdc42",
    "name": "Gel Pen 4 Color",
    "type": "other",
    "sku": "GP-Blue",
    "barcode": null,
    "image_url": "",
    "gsm_arena_url": null,
    "quantity": 15,
    "cost_price": 30.0,
    "selling_price": 90.0,
    "supplier": null,
    "low_stock_threshold": 5,
    "created_at": "2026-02-11T19:27:31.759133+00:00"
  }
]

# ============ CUSTOMERS DATA ============
CUSTOMERS_DATA = [
  {
    "_id": "698763d909213a67dc1f8fc8",
    "id": "8324a682-5f82-4250-a5ae-8eb8cc31bbe7",
    "account_number": "CUST0004",
    "name": "Harry Dick",
    "email": "",
    "phone": "8762813137",
    "address": "11 Giltress street. Rollington Town",
    "created_at": "2025-11-07T17:00:39.488903+00:00",
    "points_balance": 28.0,
    "points_earned": 28.0,
    "points_redeemed": 0,
    "total_spent": 14000.0
  },
  {
    "_id": "698763d909213a67dc1f8fc9",
    "id": "3854418b-f1b0-4458-95cc-f9cf18c89c9f",
    "account_number": null,
    "name": "Danny harry",
    "email": "",
    "phone": "+1 (954) 691-6964",
    "address": "12 Giltress Street, Kingston 2. Rollignton town",
    "created_at": "2025-11-07T18:06:59.050124+00:00",
    "points_balance": 14.0,
    "points_earned": 14.0,
    "points_redeemed": 0,
    "total_spent": 7000.0
  },
  {
    "_id": "698763d909213a67dc1f8fca",
    "id": "f5e8cdb7-92af-462e-a86a-38d794b383a0",
    "account_number": "2416",
    "name": "Jimmyd",
    "email": "richyestas@gmail.com",
    "phone": "18768432416",
    "address": "3 carmona Road, Kingston2.",
    "created_at": "2025-11-07T18:20:08.523301+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fcb",
    "id": "920982dd-55b2-490b-8ac1-7c0100ad67c8",
    "account_number": "0982",
    "name": "Bones",
    "email": "",
    "phone": "1 (876) 524-0982",
    "address": "Mountain view",
    "created_at": "2025-11-10T22:58:14.044015+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fcc",
    "id": "40ce509a-ac8d-471a-a4e5-4ce0f50f1569",
    "account_number": "1048",
    "name": "Flash Tech",
    "email": "",
    "phone": "8765021048",
    "address": "Rollington town. round a Danovan",
    "created_at": "2025-11-11T16:40:52.115555+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fcd",
    "id": "ba35ce5e-fd50-4f18-9861-33fe1c761d14",
    "account_number": "6061",
    "name": "Dannavon",
    "email": "",
    "phone": "+1 (876) 384-6061",
    "address": "Milk Avenue, Rollington Town. kgn2",
    "created_at": "2025-11-11T20:36:49.635237+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fce",
    "id": "24a27255-2ed7-414d-a520-b3b1e25b04ff",
    "account_number": null,
    "name": "John Body man",
    "email": "",
    "phone": "18762379169",
    "address": "Bygrave, Mountain View Avenue, Kingston 2.",
    "created_at": "2025-11-11T20:52:58.966449+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fcf",
    "id": "b92165a3-dffe-4ffe-ab30-a13eaf76bd25",
    "account_number": "0000",
    "name": "DC-Brina Worker",
    "email": "",
    "phone": "876-1000000",
    "address": "Langston Road, Kingston 3",
    "created_at": "2025-11-18T22:30:50.115929+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fd0",
    "id": "80682d4c-242a-4ef1-b3a2-0704e9519d61",
    "account_number": "0002",
    "name": "Assure Girl#2",
    "email": "",
    "phone": "876-1000002",
    "address": "",
    "created_at": "2025-11-18T22:32:44.291778+00:00"
  },
  {
    "_id": "698ba71c9821b2de724210a7",
    "id": "3e0305c5-a31e-4cb0-940a-7a0610a26e90",
    "account_number": "1082",
    "name": "ETTY PHONE MAN",
    "email": "",
    "phone": "876-596-1082",
    "address": "3 Keswick Road",
    "total_spent": 22000.2,
    "points_balance": 44.0004,
    "points_earned": 44.0004,
    "points_redeemed": 0,
    "created_at": "2026-02-10T21:46:04.120580+00:00"
  },
  {
    "_id": "698cd801e8b16807355c0b58",
    "id": "0b03167c-6d81-40e5-ac0b-425148e1ad33",
    "account_number": "7116",
    "name": "Lincoln Unlocker",
    "email": "",
    "phone": "876-427-7116",
    "address": "St. Thomas",
    "total_spent": 0,
    "points_balance": 0,
    "points_earned": 0,
    "points_redeemed": 0,
    "created_at": "2026-02-11T19:26:57.893369+00:00"
  },
  {
    "_id": "698cd801e8b16807355c0b59",
    "id": "b0854314-e10c-4fa8-bda4-114f8dd8d356",
    "account_number": "9628",
    "name": "Willow",
    "email": "dunstanwilson@yahoo.com",
    "phone": "876-997-9628",
    "address": "18 Molines Road, Kingston10",
    "total_spent": 0,
    "points_balance": 0,
    "points_earned": 0,
    "points_redeemed": 0,
    "created_at": "2026-02-11T19:26:57.971795+00:00"
  },
  {
    "_id": "698cd802e8b16807355c0b5a",
    "id": "1b505008-1671-4b4a-a636-1fcdfc03fe70",
    "account_number": "0754",
    "name": "Jason Mechanic",
    "email": "",
    "phone": "1876-328-0754",
    "address": "Grafton road, vineyard town, kgn 3",
    "total_spent": 0,
    "points_balance": 0,
    "points_earned": 0,
    "points_redeemed": 0,
    "created_at": "2026-02-11T19:26:58.045128+00:00"
  },
  {
    "_id": "698cd802e8b16807355c0b5b",
    "id": "10ff4fba-36d1-4738-8ff7-4e30cfcdc611",
    "account_number": "7068",
    "name": "Etti Tech",
    "email": "",
    "phone": "18765237068",
    "address": "Works at harry dick phone shop",
    "total_spent": 0,
    "points_balance": 0,
    "points_earned": 0,
    "points_redeemed": 0,
    "created_at": "2026-02-11T19:26:58.118251+00:00"
  },
  {
    "_id": "698cd802e8b16807355c0b5c",
    "id": "0536323a-cd83-43ea-877a-b8753844824e",
    "account_number": "0000A",
    "name": "Taxi service Chin Daughter",
    "email": "",
    "phone": "18760000000",
    "address": "",
    "total_spent": 0,
    "points_balance": 0,
    "points_earned": 0,
    "points_redeemed": 0,
    "created_at": "2026-02-11T19:26:58.194013+00:00"
  },
  {
    "_id": "698cd802e8b16807355c0b5d",
    "id": "50fa543e-8ecf-49df-82e7-4c3b3224c407",
    "account_number": "1295",
    "name": "Trix",
    "email": "",
    "phone": "18768371295",
    "address": "Town. Beside KPH",
    "total_spent": 0,
    "points_balance": 0,
    "points_earned": 0,
    "points_redeemed": 0,
    "created_at": "2026-02-11T19:26:58.314293+00:00"
  },
  {
    "_id": "698cd802e8b16807355c0b5e",
    "id": "01ffc832-9384-41b3-888f-f932f6cec0d7",
    "account_number": "8215",
    "name": "Face boy",
    "email": "Doshaneyoung21@gmail.com",
    "phone": "876-831-8215",
    "address": "96 Orange street. Down Town",
    "total_spent": 21000.0,
    "points_balance": 42.0,
    "points_earned": 42.0,
    "points_redeemed": 0,
    "created_at": "2026-02-11T19:26:58.387861+00:00"
  }
]

# ============ USERS DATA ============
USERS_DATA = [
  {
    "_id": "698763d909213a67dc1f8fc7",
    "id": "c5d5da64-991c-4b05-a6ea-ff2f6ef6e28d",
    "username": "Ian Miller",
    "email": "richyestas@gmail.com",
    "role": "admin",
    "created_at": "2025-11-06T22:11:41.126547+00:00",
    "password_hash": "$2b$12$Ig4d0UpRZttu5cfDbs.xieTkK5ZRVkFdR3cBBVj9cORlwRxx00oSy"
  },
  {
    "_id": "698766779ed783ea30a27e0c",
    "id": "85723f59-9d39-4375-b83e-39910f1b09ef",
    "username": "test_admin",
    "email": "admin@test.com",
    "role": "admin",
    "created_at": "2026-02-07T16:21:11.395059+00:00",
    "password_hash": "$2b$12$D/82qcWPi8Mddy5urd7AieIDiUt6Fh.RdotG1wCr1C2d9Zlbxaeka"
  },
  {
    "_id": "698766779ed783ea30a27e0d",
    "id": "093723e9-eec7-403d-a87d-6c3a00e24a69",
    "username": "test_cashier",
    "email": "cashier@test.com",
    "role": "cashier",
    "created_at": "2026-02-07T16:21:11.682478+00:00",
    "password_hash": "$2b$12$kcwH48QQeoOFci1yomzuKOM9HuTUhBQLu9Owo9MTsACm4lfLcyWRq"
  },
  {
    "_id": "698767479ed783ea30a27e10",
    "id": "4d86a26c-7495-4cef-9d1a-ce61c3bcc537",
    "username": "admin",
    "email": "admin@techzone.com",
    "role": "admin",
    "created_at": "2026-02-07T16:24:39.394025+00:00",
    "password_hash": "$2b$12$cMaeDxJvTrsDer/m.6yhtOCBmc0thkFvLG.k8R8cVaGyAws6AIP5e"
  },
  {
    "_id": "69877144dd3cdacbc76c54d3",
    "id": "1757b5c9-a9d7-4a80-9262-654537328843",
    "username": "test_cashier_170716",
    "email": "test@example.com",
    "role": "cashier",
    "created_at": "2026-02-07T17:07:16.612411+00:00",
    "password_hash": "$2b$12$SIfDFbEhbwv3mWX0Dpi/duUIogdTI7IRolN540ToOGrEKARDglb12"
  }
]

# ============ SALES DATA ============
SALES_DATA = [
  {
    "_id": "698763d909213a67dc1f8ff5",
    "id": "75b9c14e-70a5-4530-a5a7-69bdb6249c80",
    "items": [
      {
        "item_id": "a091ec21-06a1-47d7-b540-22d30ec95064",
        "item_name": "SAM-A11 SMALL",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 350.0,
    "total": 3850.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-07T16:10:08.859728+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ff6",
    "id": "a1edcef6-aebf-4b40-b55d-ec997c85c93a",
    "items": [
      {
        "item_id": "875aa90c-8f6d-46b4-83ec-5b6d94793bdc",
        "item_name": "SM-A057(A05S)",
        "quantity": 1,
        "price": 4000.0,
        "subtotal": 4000.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 4000.0,
    "tax": 400.0,
    "total": 4400.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-07T16:25:32.440231+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ff7",
    "id": "8419409e-9e98-4df2-b0aa-9e2639e4bf68",
    "items": [
      {
        "item_id": "f61f7739-16b1-4eca-8ea2-3eaaa72a0314",
        "item_name": "SM-A03(A04E/02S SMALL)",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 350.0,
    "total": 3850.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-07T16:35:52.413199+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ff8",
    "id": "462412cb-cc07-4076-b166-e50b4cd5af88",
    "items": [
      {
        "item_id": "875aa90c-8f6d-46b4-83ec-5b6d94793bdc",
        "item_name": "SM-A057(A05S)",
        "quantity": 1,
        "price": 4000.0,
        "subtotal": 4000.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 4000.0,
    "tax": 400.0,
    "total": 4400.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-07T16:39:28.410125+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ff9",
    "id": "5795aecf-63fd-493b-8ae7-ce1725dd1bf1",
    "items": [
      {
        "item_id": "f61f7739-16b1-4eca-8ea2-3eaaa72a0314",
        "item_name": "SM-A03(A04E/02S SMALL)",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 350.0,
    "total": 3850.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-07T16:39:42.278452+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ffa",
    "id": "71d3372d-57ae-4ea2-aa25-609725056fe0",
    "items": [
      {
        "item_id": "13d0e202-d226-4819-8263-562b65bd2e3f",
        "item_name": "SAM-A04",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": null,
    "customer_name": "harry dick",
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 350.0,
    "total": 3850.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-07T16:45:04.776717+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ffb",
    "id": "25351f52-650b-462f-812d-6d6bb51a0234",
    "items": [
      {
        "item_id": "a9e8eb6a-a3ad-4f79-861f-551ac629b610",
        "item_name": "SM-A037",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 350.0,
    "total": 3850.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-07T18:09:52.337727+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ffc",
    "id": "5abbe185-6084-4736-b7c5-6f9cd4c2c70a",
    "items": [
      {
        "item_id": "a9e8eb6a-a3ad-4f79-861f-551ac629b610",
        "item_name": "SM-A037",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": null,
    "customer_name": "danny harry",
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 350.0,
    "total": 3850.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-07T18:15:54.550092+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ffd",
    "id": "07b9906f-8ad9-487a-bfa5-2cabf3b4fb08",
    "items": [
      {
        "item_id": "b38acc47-fa45-498c-bc9b-cb1130c6b415",
        "item_name": "SAM-A11 BIG",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 350.0,
    "total": 3850.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-07T18:20:36.302409+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8ffe",
    "id": "5b5d5f97-e6ca-4578-b750-ed4742a58e1e",
    "items": [
      {
        "item_id": "a9e8eb6a-a3ad-4f79-861f-551ac629b610",
        "item_name": "SM-A037",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": "920982dd-55b2-490b-8ac1-7c0100ad67c8",
    "customer_name": "Bones",
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 350.0,
    "total": 3850.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-10T23:00:49.878225+00:00"
  },
  {
    "_id": "698763d909213a67dc1f8fff",
    "id": "e68ea4d7-81e4-4834-aa8d-783108a6bc80",
    "items": [
      {
        "item_id": "6455a9b3-6f24-4cb0-afb7-9d532c8a7f91",
        "item_name": "Samsung A16 4G Sub Board",
        "quantity": 1,
        "price": 2000.0,
        "subtotal": 2000.0
      }
    ],
    "customer_id": "3854418b-f1b0-4458-95cc-f9cf18c89c9f",
    "customer_name": "Danny harry",
    "payment_method": "cash",
    "subtotal": 2000.0,
    "tax": 200.0,
    "total": 2200.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-10T23:05:48.323213+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9000",
    "id": "c1c54e2d-d3a5-4053-9af5-9eab0c9851b3",
    "items": [
      {
        "item_id": "ec05cbea-7f46-4e99-b46b-f4432b927366",
        "item_name": "SAMSUNG A03",
        "quantity": 1,
        "price": 3499.99,
        "subtotal": 3499.99
      }
    ],
    "customer_id": null,
    "customer_name": "danny harry",
    "payment_method": "cash",
    "subtotal": 3499.99,
    "tax": 349.999,
    "total": 3849.9889999999996,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-11T16:53:38.458249+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9001",
    "id": "402b2362-6605-439d-aace-9071966c1297",
    "items": [
      {
        "item_id": "ec05cbea-7f46-4e99-b46b-f4432b927366",
        "item_name": "SAMSUNG A03",
        "quantity": 1,
        "price": 3499.99,
        "subtotal": 3499.99
      },
      {
        "item_id": "f61f7739-16b1-4eca-8ea2-3eaaa72a0314",
        "item_name": "SM-A03(A04E/02S SMALL)",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": null,
    "customer_name": "danny harry",
    "payment_method": "cash",
    "subtotal": 6999.99,
    "tax": 699.999,
    "total": 7699.989,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-11T16:54:24.954189+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9002",
    "id": "3cb3a1d9-8fd9-4f23-b493-916e77276120",
    "items": [
      {
        "item_id": "3fedb70a-862b-4d79-bb41-b6abbeaecd28",
        "item_name": "SAM-05",
        "quantity": 1,
        "price": 4000.0,
        "subtotal": 4000.0
      }
    ],
    "customer_id": null,
    "customer_name": "flash danovan",
    "payment_method": "cash",
    "subtotal": 4000.0,
    "tax": 400.0,
    "total": 4400.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-11T16:55:28.394352+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9003",
    "id": "1e3a0609-21ef-47d8-97c1-b621d7104008",
    "items": [
      {
        "item_id": "6b65e602-c3f8-4b37-b3de-79250c0104e5",
        "item_name": "Samsung A-217",
        "quantity": 1,
        "price": 3499.99,
        "subtotal": 3499.99
      }
    ],
    "customer_id": "3854418b-f1b0-4458-95cc-f9cf18c89c9f",
    "customer_name": "Danny harry",
    "payment_method": "cash",
    "subtotal": 3499.99,
    "tax": 349.999,
    "total": 3849.9889999999996,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-11T18:47:06.886514+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9004",
    "id": "12a8d9f0-186e-4784-b82f-bc60c60f7ec9",
    "items": [
      {
        "item_id": "52b4bbdd-d715-459d-a0e7-4c6802e29326",
        "item_name": "SAM-A146B (A14 5G)",
        "quantity": 1,
        "price": 4000.0,
        "subtotal": 4000.0
      }
    ],
    "customer_id": "8324a682-5f82-4250-a5ae-8eb8cc31bbe7",
    "customer_name": "Harry Dick",
    "payment_method": "cash",
    "subtotal": 4000.0,
    "tax": 400.0,
    "total": 4400.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-11T19:08:10.332589+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9005",
    "id": "cbf53c66-79ae-4b9d-83f2-d6b4e0dc5ed1",
    "items": [
      {
        "item_id": "52b4bbdd-d715-459d-a0e7-4c6802e29326",
        "item_name": "SAM-A146B (A14 5G)",
        "quantity": 1,
        "price": 4000.0,
        "subtotal": 4000.0
      }
    ],
    "customer_id": "3854418b-f1b0-4458-95cc-f9cf18c89c9f",
    "customer_name": "Danny harry",
    "payment_method": "cash",
    "subtotal": 4000.0,
    "tax": 400.0,
    "total": 4400.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-11T20:32:45.907116+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9006",
    "id": "889e9a12-8746-40a0-a2a7-0193fcab00b1",
    "items": [
      {
        "item_id": "597c6a52-adb4-420c-9830-6c609cbb8552",
        "item_name": "SAM-A15 INCELL IN FRAME",
        "quantity": 1,
        "price": 6000.0,
        "subtotal": 6000.0
      }
    ],
    "customer_id": "8324a682-5f82-4250-a5ae-8eb8cc31bbe7",
    "customer_name": "Harry Dick",
    "payment_method": "cash",
    "subtotal": 6000.0,
    "tax": 600.0,
    "total": 6600.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-11T20:33:14.524992+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9007",
    "id": "779a7f4a-cd13-4cbe-9f83-560ea5de5d19",
    "items": [
      {
        "item_id": "ab0eb945-f4d4-49f1-8c45-2ca39da850af",
        "item_name": "Iphone 16 Pro Max Case-NF Green",
        "quantity": 1,
        "price": 2000.0,
        "subtotal": 2000.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 2000.0,
    "tax": 200.0,
    "total": 2200.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-12T18:46:13.615001+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9008",
    "id": "49668d4c-0b3a-4c74-8171-bc6a55ce963b",
    "items": [
      {
        "item_id": "dcb24ebb-7b4e-4492-9323-9fb6d4a2386b",
        "item_name": "Vehicle Phone holder",
        "quantity": 1,
        "price": 1500.0,
        "subtotal": 1500.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 1500.0,
    "tax": 150.0,
    "total": 1650.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-12T19:18:10.190203+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9009",
    "id": "fd6dc373-5627-4ad0-b1fa-4ac22b574f24",
    "items": [
      {
        "item_id": "571b0c40-e21f-43af-b078-5fa027c06faf",
        "item_name": "Samsung A06",
        "quantity": 1,
        "price": 4000.0,
        "subtotal": 4000.0
      }
    ],
    "customer_id": "3854418b-f1b0-4458-95cc-f9cf18c89c9f",
    "customer_name": "Danny harry",
    "payment_method": "cash",
    "subtotal": 4000.0,
    "tax": 400.0,
    "total": 4400.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-12T21:14:38.223275+00:00"
  },
  {
    "_id": "698763d909213a67dc1f900a",
    "id": "7e146d2a-38de-484b-8e72-dbe757f63131",
    "items": [
      {
        "item_id": "e77916a3-e5a2-48e1-9a6e-cfa12c2dca1d",
        "item_name": "LG STYLO 6",
        "quantity": 1,
        "price": 5999.99,
        "subtotal": 5999.99
      }
    ],
    "customer_id": "8324a682-5f82-4250-a5ae-8eb8cc31bbe7",
    "customer_name": "Harry Dick",
    "payment_method": "cash",
    "subtotal": 5999.99,
    "tax": 599.999,
    "total": 6599.989,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-18T17:42:28.103965+00:00"
  },
  {
    "_id": "698763d909213a67dc1f900b",
    "id": "2f0c3efc-fc36-4021-afa2-3dbc8ec71f5b",
    "items": [
      {
        "item_id": "b2df785a-0026-49fb-927c-45d27f5efb36",
        "item_name": "ZTE BLADE A35E",
        "quantity": 1,
        "price": 4999.99,
        "subtotal": 4999.99
      }
    ],
    "customer_id": "8324a682-5f82-4250-a5ae-8eb8cc31bbe7",
    "customer_name": "Harry Dick",
    "payment_method": "cash",
    "subtotal": 4999.99,
    "tax": 499.999,
    "total": 5499.989,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-18T17:43:39.202906+00:00"
  },
  {
    "_id": "698763d909213a67dc1f900c",
    "id": "bb88c453-1c18-4e81-915e-db12bc31c10b",
    "items": [
      {
        "item_id": "06b3f103-6f82-44e7-addb-eec50a70ae31",
        "item_name": "SAM-A12-F12-UNIVERSAL",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": "3854418b-f1b0-4458-95cc-f9cf18c89c9f",
    "customer_name": "Danny harry",
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 350.0,
    "total": 3850.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-18T22:10:21.887895+00:00"
  },
  {
    "_id": "698763d909213a67dc1f900d",
    "id": "2417a575-8dc7-4d0a-b6e7-ebaab087783d",
    "items": [
      {
        "item_id": "6b65e602-c3f8-4b37-b3de-79250c0104e5",
        "item_name": "Samsung A-217",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": "3854418b-f1b0-4458-95cc-f9cf18c89c9f",
    "customer_name": "Danny harry",
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 350.0,
    "total": 3850.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-18T23:14:59.288619+00:00"
  },
  {
    "_id": "698763d909213a67dc1f900e",
    "id": "445c23c9-9352-4f1d-98ff-62b3efec374c",
    "items": [
      {
        "item_id": "6b65e602-c3f8-4b37-b3de-79250c0104e5",
        "item_name": "Samsung A-217",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": "3854418b-f1b0-4458-95cc-f9cf18c89c9f",
    "customer_name": "Danny harry",
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 350.0,
    "total": 3850.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-18T23:36:48.523531+00:00"
  },
  {
    "_id": "698763d909213a67dc1f900f",
    "id": "dec0b374-6388-4f0b-bd84-ece3f8d4e1d7",
    "items": [
      {
        "item_id": "52b4bbdd-d715-459d-a0e7-4c6802e29326",
        "item_name": "SAM-A146B (A14 5G)",
        "quantity": 1,
        "price": 4000.0,
        "subtotal": 4000.0
      }
    ],
    "customer_id": "80682d4c-242a-4ef1-b3a2-0704e9519d61",
    "customer_name": "Assure Girl#2",
    "payment_method": "cash",
    "subtotal": 4000.0,
    "tax": 400.0,
    "total": 4400.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-18T23:38:47.130127+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9010",
    "id": "0e991247-1008-4c44-89d6-ab0af2793bbf",
    "items": [
      {
        "item_id": "d61f2cbf-b76b-478b-a756-159c68e5dd12",
        "item_name": "Samsung A52 Oled in Frame",
        "quantity": 1,
        "price": 12000.0,
        "subtotal": 12000.0
      }
    ],
    "customer_id": "b92165a3-dffe-4ffe-ab30-a13eaf76bd25",
    "customer_name": "DC-Brina Worker",
    "payment_method": "cash",
    "subtotal": 12000.0,
    "tax": 1200.0,
    "total": 13200.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-18T23:39:22.698968+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9011",
    "id": "35b43acf-720d-4c05-b440-4c879a07da2c",
    "items": [
      {
        "item_id": "597c6a52-adb4-420c-9830-6c609cbb8552",
        "item_name": "SAM-A15 INCELL IN FRAME",
        "quantity": 1,
        "price": 6000.0,
        "subtotal": 6000.0
      }
    ],
    "customer_id": "8324a682-5f82-4250-a5ae-8eb8cc31bbe7",
    "customer_name": "Harry Dick",
    "payment_method": "cash",
    "subtotal": 6000.0,
    "tax": 600.0,
    "total": 6600.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-19T17:34:12.669467+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9012",
    "id": "190b3de9-515b-47f7-aa0e-2b26f3afdd21",
    "items": [
      {
        "item_id": "597c6a52-adb4-420c-9830-6c609cbb8552",
        "item_name": "SAM-A15 INCELL IN FRAME",
        "quantity": 1,
        "price": 6000.0,
        "subtotal": 6000.0
      }
    ],
    "customer_id": "8324a682-5f82-4250-a5ae-8eb8cc31bbe7",
    "customer_name": "Harry Dick",
    "payment_method": "cash",
    "subtotal": 6000.0,
    "tax": 600.0,
    "total": 6600.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2025-11-19T17:44:00.960353+00:00"
  },
  {
    "_id": "698763e009213a67dc1f9017",
    "id": "198eec3b-0263-4296-b9b6-748cd55f08ca",
    "items": [
      {
        "item_id": "87b3ea22-ab65-4be0-9a1a-4fb2f6d29052",
        "item_name": "iPhone XR Screen",
        "quantity": 1,
        "price": 90.0,
        "subtotal": 90.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 90.0,
    "tax": 0.0,
    "total": 90.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "test_user",
    "created_at": "2026-02-07T16:10:08.518794+00:00"
  },
  {
    "_id": "698763e009213a67dc1f9018",
    "id": "c1cc51e1-93cf-4325-8f29-ac926ce8d9dc",
    "items": [
      {
        "item_id": "87b3ea22-ab65-4be0-9a1a-4fb2f6d29052",
        "item_name": "iPhone XR Screen",
        "quantity": 2,
        "price": 90.0,
        "subtotal": 180.0
      },
      {
        "item_id": "b532fa64-c570-4ede-bf18-5c9e1bbcd131",
        "item_name": "Samsung Galaxy S21",
        "quantity": 2,
        "price": 650.0,
        "subtotal": 1300.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 1480.0,
    "tax": 0.0,
    "total": 1480.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "test_user",
    "created_at": "2026-02-07T16:10:08.605855+00:00"
  },
  {
    "_id": "698766779ed783ea30a27e0e",
    "id": "2c2d9cce-2cbc-45bc-9214-e58820ffa65f",
    "items": [
      {
        "item_id": "test-item-1",
        "item_name": "Test Phone",
        "quantity": 1,
        "price": 100.0,
        "subtotal": 100.0
      }
    ],
    "customer_id": null,
    "customer_name": "Test Customer",
    "payment_method": "cash",
    "subtotal": 100.0,
    "tax": 10.0,
    "total": 110.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "test_admin",
    "created_at": "2026-02-07T16:21:11.958856+00:00"
  },
  {
    "_id": "698766789ed783ea30a27e0f",
    "id": "20052837-94be-4f37-aec9-352de736b3d1",
    "items": [
      {
        "item_id": "test-item-1",
        "item_name": "Test Phone",
        "quantity": 1,
        "price": 100.0,
        "subtotal": 100.0
      }
    ],
    "customer_id": null,
    "customer_name": "Test Customer",
    "payment_method": "cash",
    "subtotal": 100.0,
    "tax": 0.0,
    "total": 100.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "test_admin",
    "created_at": "2026-02-07T16:21:12.040250+00:00"
  },
  {
    "_id": "698768659ed783ea30a27e11",
    "id": "254d1ff4-319a-4752-8ee7-3bc71a9e3881",
    "items": [
      {
        "item_id": "87b3ea22-ab65-4be0-9a1a-4fb2f6d29052",
        "item_name": "iPhone XR Screen",
        "quantity": 1,
        "price": 90.0,
        "subtotal": 90.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 90.0,
    "tax": 9.0,
    "total": 99.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "admin",
    "created_at": "2026-02-07T16:29:25.752778+00:00"
  },
  {
    "_id": "698768659ed783ea30a27e12",
    "id": "ee900c62-9483-43de-8ee0-8dbb3fd7e6ce",
    "items": [
      {
        "item_id": "87b3ea22-ab65-4be0-9a1a-4fb2f6d29052",
        "item_name": "iPhone XR Screen",
        "quantity": 1,
        "price": 90.0,
        "subtotal": 90.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 90.0,
    "tax": 0.0,
    "total": 90.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "admin",
    "created_at": "2026-02-07T16:29:25.882869+00:00"
  },
  {
    "_id": "69876bb800fcc95c1bee2386",
    "id": "3db27802-0804-40c5-9ed0-c7d0b8c3065b",
    "items": [
      {
        "item_id": "87b3ea22-ab65-4be0-9a1a-4fb2f6d29052",
        "item_name": "iPhone XR Screen",
        "quantity": 1,
        "price": 90.0,
        "subtotal": 90.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 90.0,
    "tax": 0.0,
    "total": 90.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "admin",
    "created_at": "2026-02-07T16:43:36.366923+00:00"
  },
  {
    "_id": "69876bb800fcc95c1bee2387",
    "id": "c897d3bb-1d91-4f22-b396-6afd88d5d985",
    "items": [
      {
        "item_id": "87b3ea22-ab65-4be0-9a1a-4fb2f6d29052",
        "item_name": "iPhone XR Screen",
        "quantity": 1,
        "price": 90.0,
        "subtotal": 90.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 90.0,
    "tax": 0.0,
    "total": 90.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "admin",
    "created_at": "2026-02-07T16:43:36.532514+00:00"
  },
  {
    "_id": "69876bea00fcc95c1bee238d",
    "id": "13f0acf7-8506-44c4-b66b-da8844df8fee",
    "items": [
      {
        "item_id": "fe558b62-aeb8-4142-8313-89056a243df4",
        "item_name": "Test Phone",
        "quantity": 1,
        "price": 800.0,
        "subtotal": 800.0
      },
      {
        "item_id": "2c4d71ee-930e-436e-a18d-ed0e1193f335",
        "item_name": "Test Screen",
        "quantity": 1,
        "price": 80.0,
        "subtotal": 80.0
      },
      {
        "item_id": "e03ffbe8-1d47-4069-9ee6-4102ae2185e4",
        "item_name": "Test Part",
        "quantity": 1,
        "price": 25.0,
        "subtotal": 25.0
      },
      {
        "item_id": "4bd51384-b099-47b1-9b8b-af182bee180c",
        "item_name": "Test Accessory",
        "quantity": 1,
        "price": 10.0,
        "subtotal": 10.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 915.0,
    "tax": 81.0,
    "total": 996.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "admin",
    "created_at": "2026-02-07T16:44:26.176022+00:00"
  },
  {
    "_id": "69876e171ea5dd02d748c7af",
    "id": "fcbc9aef-173a-4ae8-a7f6-b01cc6affee2",
    "items": [
      {
        "item_id": "15782fca-cb10-4546-9a17-8d5c6e88f1fa",
        "item_name": "Report Test iPhone",
        "quantity": 1,
        "price": 1000.0,
        "subtotal": 1000.0
      },
      {
        "item_id": "8edc7a76-a8fe-418e-87d3-fcb484aac066",
        "item_name": "Report Test Accessory",
        "quantity": 2,
        "price": 15.0,
        "subtotal": 30.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 1030.0,
    "tax": 103.0,
    "total": 1133.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "admin",
    "created_at": "2026-02-07T16:53:43.630546+00:00"
  },
  {
    "_id": "69876e171ea5dd02d748c7b0",
    "id": "bdb3b1fc-07cf-4b83-aae7-a478051f5ff1",
    "items": [
      {
        "item_id": "aea4aa78-fe2c-4a84-ac4c-eff297eaff7b",
        "item_name": "Report Test Screen",
        "quantity": 1,
        "price": 100.0,
        "subtotal": 100.0
      },
      {
        "item_id": "5f8fe7d8-ee78-4c42-ab10-1d9e348074da",
        "item_name": "Report Test Part",
        "quantity": 1,
        "price": 40.0,
        "subtotal": 40.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 140.0,
    "tax": 0.0,
    "total": 140.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "admin",
    "created_at": "2026-02-07T16:53:43.673558+00:00"
  },
  {
    "_id": "69876e171ea5dd02d748c7b1",
    "id": "704dc6e4-d5a3-49d3-9b49-f88707426e8c",
    "items": [
      {
        "item_id": "15782fca-cb10-4546-9a17-8d5c6e88f1fa",
        "item_name": "Report Test iPhone",
        "quantity": 1,
        "price": 1000.0,
        "subtotal": 1000.0
      },
      {
        "item_id": "aea4aa78-fe2c-4a84-ac4c-eff297eaff7b",
        "item_name": "Report Test Screen",
        "quantity": 1,
        "price": 100.0,
        "subtotal": 100.0
      },
      {
        "item_id": "5f8fe7d8-ee78-4c42-ab10-1d9e348074da",
        "item_name": "Report Test Part",
        "quantity": 1,
        "price": 40.0,
        "subtotal": 40.0
      },
      {
        "item_id": "8edc7a76-a8fe-418e-87d3-fcb484aac066",
        "item_name": "Report Test Accessory",
        "quantity": 1,
        "price": 15.0,
        "subtotal": 15.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 1155.0,
    "tax": 101.5,
    "total": 1256.5,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "admin",
    "created_at": "2026-02-07T16:53:43.714632+00:00"
  },
  {
    "_id": "69877144dd3cdacbc76c54d1",
    "id": "643fe5f1-c4c7-4cca-af3f-4434f845d139",
    "items": [
      {
        "item_id": "87b3ea22-ab65-4be0-9a1a-4fb2f6d29052",
        "item_name": "iPhone XR Screen",
        "quantity": 1,
        "price": 90.0,
        "subtotal": 90.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 90.0,
    "tax": 0.0,
    "total": 90.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "admin",
    "created_at": "2026-02-07T17:07:16.019438+00:00"
  },
  {
    "_id": "69877144dd3cdacbc76c54d2",
    "id": "06bc7249-9d87-4796-98fe-ec4b1608995a",
    "items": [
      {
        "item_id": "87b3ea22-ab65-4be0-9a1a-4fb2f6d29052",
        "item_name": "iPhone XR Screen",
        "quantity": 1,
        "price": 90.0,
        "subtotal": 90.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 90.0,
    "tax": 0.0,
    "total": 90.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "admin",
    "created_at": "2026-02-07T17:07:16.307287+00:00"
  },
  {
    "_id": "6987785a4791609ca7bdbc2e",
    "id": "28c8bf38-4650-448e-8b55-f8dbba2435dd",
    "items": [
      {
        "item_id": "1",
        "item_name": "Test Item",
        "quantity": 1,
        "price": 100.0,
        "subtotal": 100.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 100.0,
    "tax": 0.0,
    "discount": 20.0,
    "coupon_code": "SAVE20",
    "coupon_id": "aa39e68c-6e11-4c47-ab6c-98f2a7008ecb",
    "total": 80.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "admin",
    "created_at": "2026-02-07T17:37:30.303142+00:00"
  },
  {
    "_id": "698784484791609ca7bdbc31",
    "id": "be389a9c-3ed4-4045-bbfd-36f46649b73a",
    "items": [
      {
        "item_id": "534c247a-e948-4534-bb3b-00b8d1d19d8c",
        "item_name": "Car Charger",
        "quantity": 1,
        "price": 1500.0,
        "subtotal": 1500.0
      }
    ],
    "customer_id": "f5e8cdb7-92af-462e-a86a-38d794b383a0",
    "customer_name": "Jimmyd",
    "payment_method": "cash",
    "subtotal": 1500.0,
    "tax": 0.0,
    "discount": 100.0,
    "coupon_code": "SAVE20",
    "coupon_id": "aa39e68c-6e11-4c47-ab6c-98f2a7008ecb",
    "total": 1400.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "admin",
    "created_at": "2026-02-07T18:28:24.405776+00:00"
  },
  {
    "_id": "69878fac4791609ca7bdbc32",
    "id": "11bde162-f200-47cb-8ee3-b7232a33ab04",
    "items": [
      {
        "item_id": "06b3f103-6f82-44e7-addb-eec50a70ae31",
        "item_name": "SAM-A12-F12-UNIVERSAL",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": "8324a682-5f82-4250-a5ae-8eb8cc31bbe7",
    "customer_name": "Harry Dick",
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 0.0,
    "discount": 0.0,
    "coupon_code": null,
    "coupon_id": null,
    "total": 3500.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-07T19:17:00.011290+00:00"
  },
  {
    "_id": "698a2ffa6b89a84368d4ebe4",
    "id": "cd42a7fd-f822-4f84-9bbb-fbb7475c23b9",
    "items": [
      {
        "item_id": "2ac4e7eb-98d3-4358-a702-fe6a61429a38",
        "item_name": "Samsung A05",
        "quantity": 1,
        "price": 4000.0,
        "subtotal": 4000.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 4000.0,
    "tax": 0.0,
    "discount": 0.0,
    "coupon_code": null,
    "coupon_id": null,
    "total": 4000.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-09T19:05:30.017003+00:00"
  },
  {
    "_id": "698b901dc21b8ddc89433223",
    "id": "8cd6c934-8be0-4ae8-ab61-9331f52b71f3",
    "items": [
      {
        "item_id": "13d0e202-d226-4819-8263-562b65bd2e3f",
        "item_name": "SAM-A04",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 175.0,
    "discount": 100.0,
    "coupon_code": "SAVE20",
    "coupon_id": "aa39e68c-6e11-4c47-ab6c-98f2a7008ecb",
    "points_used": 0.0,
    "points_discount": 0.0,
    "points_earned": 0.0,
    "total": 3575.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-10T20:07:57.358266+00:00"
  },
  {
    "_id": "698ba79c9821b2de724210a8",
    "id": "829632b8-122d-4780-acf1-2a68bf640e8c",
    "items": [
      {
        "item_id": "5a2d8580-1a22-4f8a-a112-cd8e36a9366c",
        "item_name": "SAMSUNG AO3 CORE",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      },
      {
        "item_id": "06b3f103-6f82-44e7-addb-eec50a70ae31",
        "item_name": "SAM-A12-F12-UNIVERSAL",
        "quantity": 2,
        "price": 3500.0,
        "subtotal": 7000.0
      }
    ],
    "customer_id": "3e0305c5-a31e-4cb0-940a-7a0610a26e90",
    "customer_name": "ETTY PHONE MAN",
    "payment_method": "cash",
    "subtotal": 10500.0,
    "tax": 0.0,
    "discount": 499.79999999999995,
    "coupon_code": "SAVE500",
    "coupon_id": "5a51721b-a13e-4add-8533-1fe758ef4ad8",
    "points_used": 0.0,
    "points_discount": 0.0,
    "points_earned": 20.000400000000003,
    "total": 10000.2,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-10T21:48:12.020023+00:00"
  },
  {
    "_id": "698baf0b545f416fa4635b74",
    "id": "df057518-49cf-41fd-9728-ed75ba22c24c",
    "items": [
      {
        "item_id": "d61f2cbf-b76b-478b-a756-159c68e5dd12",
        "item_name": "Samsung A52 Oled in Frame",
        "quantity": 1,
        "price": 12000.0,
        "subtotal": 12000.0
      }
    ],
    "customer_id": "3e0305c5-a31e-4cb0-940a-7a0610a26e90",
    "customer_name": "ETTY PHONE MAN",
    "payment_method": "cash",
    "subtotal": 12000.0,
    "tax": 0.0,
    "discount": 0.0,
    "coupon_code": null,
    "coupon_id": null,
    "points_used": 0.0,
    "points_discount": 0.0,
    "points_earned": 24.0,
    "total": 12000.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-10T22:19:55.253342+00:00"
  },
  {
    "_id": "698ccdd34c4473b6e7f7eaaa",
    "id": "2332b11d-b35b-42ca-845b-094fd89f084f",
    "items": [
      {
        "item_id": "d5f44f1c-2570-4c59-a8f5-84ad489c3c53",
        "item_name": "SAMSUNG A02S(A04E)",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      },
      {
        "item_id": "0614ddd9-8517-41fc-a30d-1d94da9298d9",
        "item_name": "SM-A047",
        "quantity": 1,
        "price": 4000.0,
        "subtotal": 4000.0
      },
      {
        "item_id": "571b0c40-e21f-43af-b078-5fa027c06faf",
        "item_name": "Samsung A06",
        "quantity": 1,
        "price": 4000.0,
        "subtotal": 4000.0
      },
      {
        "item_id": "a9e8eb6a-a3ad-4f79-861f-551ac629b610",
        "item_name": "SM-A037",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": "8324a682-5f82-4250-a5ae-8eb8cc31bbe7",
    "customer_name": "Harry Dick",
    "payment_method": "cash",
    "subtotal": 15000.0,
    "tax": 0.0,
    "discount": 1000.0,
    "coupon_code": "FIXE1000",
    "coupon_id": "bb4de32c-3d70-4efb-8b49-3b4c4faa3e3f",
    "points_used": 0.0,
    "points_discount": 0.0,
    "points_earned": 28.0,
    "total": 14000.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-11T18:43:31.884734+00:00"
  },
  {
    "_id": "698d08fa6c398b8d6673ffea",
    "id": "cef9c200-42f5-47b5-847d-95192e192586",
    "items": [
      {
        "item_id": "cc60f5d8-b69d-4c00-9d28-40b285a0df69",
        "item_name": "SAMSUNG S23 ULTRA",
        "quantity": 1,
        "price": 21000.0,
        "subtotal": 21000.0
      }
    ],
    "customer_id": "01ffc832-9384-41b3-888f-f932f6cec0d7",
    "customer_name": "Face boy",
    "payment_method": "cash",
    "subtotal": 21000.0,
    "tax": 0.0,
    "discount": 0.0,
    "coupon_code": null,
    "coupon_id": null,
    "points_used": 0.0,
    "points_discount": 0.0,
    "points_earned": 42.0,
    "total": 21000.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-11T22:55:54.806486+00:00"
  },
  {
    "_id": "698d09a96c398b8d6673ffec",
    "id": "7ff62bb1-bb6d-4d23-a3f9-41b20d1105ba",
    "items": [
      {
        "item_id": "f61f7739-16b1-4eca-8ea2-3eaaa72a0314",
        "item_name": "SM-A03(A04E/02S SMALL)",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": null,
    "customer_name": "Kido Girl",
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 0.0,
    "discount": 0.0,
    "coupon_code": null,
    "coupon_id": null,
    "points_used": 0.0,
    "points_discount": 0.0,
    "points_earned": 0.0,
    "total": 3500.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-11T22:58:49.621868+00:00"
  },
  {
    "_id": "698df56a6cd3e6ef7a4b0f4b",
    "id": "3c002f8d-b05a-4679-9131-81bcecca313c",
    "items": [
      {
        "item_id": "d5f44f1c-2570-4c59-a8f5-84ad489c3c53",
        "item_name": "SAMSUNG A02S(A04E)",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": "3854418b-f1b0-4458-95cc-f9cf18c89c9f",
    "customer_name": "Danny harry",
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 0.0,
    "discount": 0.0,
    "coupon_code": null,
    "coupon_id": null,
    "points_used": 0.0,
    "points_discount": 0.0,
    "points_earned": 7.0,
    "total": 3500.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-12T15:44:42.634290+00:00"
  },
  {
    "_id": "698e4031789b874262a5c661",
    "id": "092e74d8-b1ce-4e57-a297-c06c9d58d7c1",
    "items": [
      {
        "item_id": "597c6a52-adb4-420c-9830-6c609cbb8552",
        "item_name": "SAM-A15 INCELL IN FRAME",
        "quantity": 1,
        "price": 6000.0,
        "subtotal": 6000.0
      }
    ],
    "customer_id": null,
    "customer_name": "Dwayne",
    "payment_method": "cash",
    "subtotal": 6000.0,
    "tax": 0.0,
    "discount": 0.0,
    "coupon_code": null,
    "coupon_id": null,
    "points_used": 0.0,
    "points_discount": 0.0,
    "points_earned": 0.0,
    "total": 6000.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-12T21:03:45.247457+00:00"
  },
  {
    "_id": "698fa7b6678540ee418516c5",
    "id": "5bff3dd1-9cbb-4563-a65e-7bfbb7a36258",
    "items": [
      {
        "item_id": "18d239d0-2231-49b5-a1d6-67019d3b04bd",
        "item_name": "Type-C Base-White",
        "quantity": 1,
        "price": 1500.0,
        "subtotal": 1500.0
      },
      {
        "item_id": "c1c620b6-2b9f-47e8-82dd-75b143d0c550",
        "item_name": "Type C-USB QHTF 6A",
        "quantity": 1,
        "price": 1000.0,
        "subtotal": 1000.0
      },
      {
        "item_id": "4f2fd5f9-d7a4-4bb9-8a39-cb54f76bd1fe",
        "item_name": "Iphone Type C-Lightening",
        "quantity": 1,
        "price": 700.0,
        "subtotal": 700.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 3200.0,
    "tax": 0.0,
    "discount": 0.0,
    "coupon_code": null,
    "coupon_id": null,
    "points_used": 0.0,
    "points_discount": 0.0,
    "points_earned": 0.0,
    "total": 3200.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-13T22:37:42.880012+00:00"
  },
  {
    "_id": "698fa7ca678540ee418516c6",
    "id": "0ff2a16e-b1f2-488a-a002-217ee8edaf8f",
    "items": [
      {
        "item_id": "f2324959-1152-419f-8936-9c516ca5d841",
        "item_name": "C-C USB WHITE",
        "quantity": 1,
        "price": 1000.0,
        "subtotal": 1000.0
      }
    ],
    "customer_id": null,
    "customer_name": "jody",
    "payment_method": "cash",
    "subtotal": 1000.0,
    "tax": 0.0,
    "discount": 0.0,
    "coupon_code": null,
    "coupon_id": null,
    "points_used": 0.0,
    "points_discount": 0.0,
    "points_earned": 0.0,
    "total": 1000.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-13T22:38:02.722937+00:00"
  },
  {
    "_id": "698fa7ea678540ee418516c7",
    "id": "ca60232c-023c-4c51-8413-b166c53a2539",
    "items": [
      {
        "item_id": "f61f7739-16b1-4eca-8ea2-3eaaa72a0314",
        "item_name": "SM-A03(A04E/02S SMALL)",
        "quantity": 1,
        "price": 3500.0,
        "subtotal": 3500.0
      }
    ],
    "customer_id": "3854418b-f1b0-4458-95cc-f9cf18c89c9f",
    "customer_name": "Danny harry",
    "payment_method": "cash",
    "subtotal": 3500.0,
    "tax": 0.0,
    "discount": 0.0,
    "coupon_code": null,
    "coupon_id": null,
    "points_used": 0.0,
    "points_discount": 0.0,
    "points_earned": 7.0,
    "total": 3500.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-13T22:38:34.938050+00:00"
  },
  {
    "_id": "6993a2663838248100aea1e5",
    "id": "b14cf733-8fbc-4245-bd7b-25a61f10bd0c",
    "items": [
      {
        "item_id": "6c78861f-8722-4674-84ed-d4fcb041f15e",
        "item_name": "SAM-A15 5G INCELL IN FRAME",
        "quantity": 1,
        "price": 7000.0,
        "subtotal": 7000.0
      }
    ],
    "customer_id": null,
    "customer_name": null,
    "payment_method": "cash",
    "subtotal": 7000.0,
    "tax": 0.0,
    "discount": 0.0,
    "coupon_code": null,
    "coupon_id": null,
    "points_used": 0.0,
    "points_discount": 0.0,
    "points_earned": 0.0,
    "total": 7000.0,
    "payment_status": "completed",
    "stripe_session_id": null,
    "paypal_order_id": null,
    "created_by": "Ian Miller",
    "created_at": "2026-02-16T23:04:06.943395+00:00"
  }
]

# ============ REPAIR_JOBS DATA ============
REPAIR_JOBS_DATA = [
  {
    "_id": "698763d909213a67dc1f9013",
    "id": "08c16222-37b1-492b-976c-9c2ff5fb8020",
    "customer_id": "24a27255-2ed7-414d-a520-b3b1e25b04ff",
    "customer_name": "John",
    "device": "Samsung A05",
    "issue_description": "Install Charging Board",
    "status": "pending",
    "assigned_technician": "jimmyd",
    "cost": 4000.0,
    "notes": "john body man. phone not charging",
    "created_at": "2025-11-11T20:53:06.063524+00:00",
    "updated_at": "2025-11-11T21:00:32.187731+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9014",
    "id": "2071905d-ee15-410f-849e-cbb748bc32df",
    "customer_id": "b92165a3-dffe-4ffe-ab30-a13eaf76bd25",
    "customer_name": "DC-Brina Worker",
    "device": "Samsung A146B",
    "issue_description": "Replaced Broken Screen",
    "status": "completed",
    "assigned_technician": "jimmyd",
    "cost": 8000.0,
    "notes": "first installed screen was broken by me and i had to replace",
    "created_at": "2025-11-18T22:30:56.264254+00:00",
    "updated_at": "2025-11-18T22:33:08.608440+00:00"
  },
  {
    "_id": "698763d909213a67dc1f9015",
    "id": "4f5b6b32-f9d1-412c-b3ce-28b5bd051dcd",
    "customer_id": "80682d4c-242a-4ef1-b3a2-0704e9519d61",
    "customer_name": "Assure Girl#2",
    "device": "Samsung A52",
    "issue_description": "Replace Broken Screen",
    "status": "completed",
    "assigned_technician": "jimmyd",
    "cost": 12000.0,
    "notes": "",
    "created_at": "2025-11-18T22:32:49.233861+00:00",
    "updated_at": "2025-11-18T22:33:14.650604+00:00"
  }
]

# ============ COUPONS DATA ============
COUPONS_DATA = [
  {
    "_id": "69877568d97dc0c31ab9e77a",
    "id": "aa39e68c-6e11-4c47-ab6c-98f2a7008ecb",
    "code": "SAVE20",
    "description": "20% off your purchase",
    "discount_type": "percentage",
    "discount_value": 20.0,
    "min_purchase": 50.0,
    "max_discount": 100.0,
    "usage_limit": null,
    "usage_count": 3,
    "is_active": true,
    "valid_from": null,
    "valid_until": null,
    "created_at": "2026-02-07T17:24:56.005452+00:00",
    "created_by": "admin"
  },
  {
    "_id": "69877639d97dc0c31ab9e77c",
    "id": "5fd69c21-adc0-407e-9403-d136aa62c202",
    "code": "SAVE15",
    "description": "Goods over $5000",
    "discount_type": "percentage",
    "discount_value": 15.0,
    "min_purchase": 1.0,
    "max_discount": 25.0,
    "usage_limit": 50,
    "usage_count": 0,
    "is_active": true,
    "valid_from": null,
    "valid_until": null,
    "created_at": "2026-02-07T17:28:25.170062+00:00",
    "created_by": "admin"
  },
  {
    "_id": "69877666d97dc0c31ab9e77d",
    "id": "bb4de32c-3d70-4efb-8b49-3b4c4faa3e3f",
    "code": "FIXE1000",
    "description": "Fixed $1,000 OFF",
    "discount_type": "fixed",
    "discount_value": 1000.0,
    "min_purchase": 11000.0,
    "max_discount": null,
    "usage_limit": 12,
    "usage_count": 1,
    "is_active": true,
    "valid_from": "2026-02-11T00:00:00.000Z",
    "valid_until": "2026-12-11T00:00:00.000Z",
    "created_at": "2026-02-07T17:29:10.817878+00:00",
    "created_by": "admin"
  },
  {
    "_id": "698ba5969821b2de724210a6",
    "id": "5a51721b-a13e-4add-8533-1fe758ef4ad8",
    "code": "SAVE500",
    "description": " Anything over $3500",
    "discount_type": "percentage",
    "discount_value": 4.76,
    "min_purchase": 3500.0,
    "max_discount": 500.0,
    "usage_limit": 12,
    "usage_count": 1,
    "is_active": true,
    "valid_from": null,
    "valid_until": "2026-12-10T00:00:00.000Z",
    "created_at": "2026-02-10T21:39:34.515247+00:00",
    "created_by": "Ian Miller"
  },
  {
    "_id": "698cccda4c4473b6e7f7eaa9",
    "id": "5fca55ae-0758-4007-8873-81f36f88aa60",
    "code": "SAVE1000",
    "description": "PURCHASE ANYTHING OVER 10000",
    "discount_type": "percentage",
    "discount_value": 9.5,
    "min_purchase": 10000.0,
    "max_discount": null,
    "usage_limit": 12,
    "usage_count": 0,
    "is_active": true,
    "valid_from": "2026-02-11T00:00:00.000Z",
    "valid_until": "2026-12-11T00:00:00.000Z",
    "created_at": "2026-02-11T18:39:22.189091+00:00",
    "created_by": "Ian Miller"
  }
]

# ============ SETTINGS DATA ============
SETTINGS_DATA = [
  {
    "_id": "69876677af6c6c1b0c9e47c7",
    "id": "app_settings",
    "currency": "JMD",
    "tax_enabled": false,
    "tax_rate": 0.05,
    "updated_at": "2026-02-11T23:43:05.593773+00:00",
    "updated_by": "Ian Miller",
    "tax_exempt_categories": [
      "accessory"
    ],
    "business_address": "30 Giltress Street, Kingston 2, JA",
    "business_logo": "https://salestax.preview.emergentagent.com/api/uploads/logo_4b7b7a93.jpg",
    "business_name": "Techzone",
    "business_phone": "(876) 843-2416 / (876) 633-9251",
    "points_enabled": true,
    "points_redemption_threshold": 3500.0,
    "points_value": 15.0,
    "points_per_dollar": 0.002
  }
]


def import_data():
    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    data_map = {
        "inventory": INVENTORY_DATA,
        "customers": CUSTOMERS_DATA,
        "users": USERS_DATA,
        "sales": SALES_DATA,
        "repair_jobs": REPAIR_JOBS_DATA,
        "coupons": COUPONS_DATA,
        "settings": SETTINGS_DATA
    }
    
    for collection_name, documents in data_map.items():
        if documents:
            # Clear existing data
            db[collection_name].delete_many({})
            
            # Remove _id fields
            for doc in documents:
                if '_id' in doc:
                    del doc['_id']
            
            # Insert new data
            if documents:
                db[collection_name].insert_many(documents)
                print(f"Imported {len(documents)} documents into {collection_name}")
    
    client.close()
    print("")
    print("Data import complete!")
    print("Login with: admin / admin123")

if __name__ == "__main__":
    import_data()
