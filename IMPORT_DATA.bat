@echo off
echo ================================================
echo TechZone POS - Data Import Script
echo ================================================
echo.

echo Checking MongoDB connection...
mongo --eval "db.version()" > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: MongoDB is not running or mongo command not found!
    echo Please start MongoDB first: mongod
    pause
    exit /b 1
)

echo MongoDB is running. Starting import...
echo.

echo [1/7] Importing Users...
mongo test_database --eval "db.users.deleteMany({})"
mongo test_database --eval "db.users.insertMany([{id:'user-1',username:'admin',email:'admin@techzone.com',role:'admin',password_hash:'$2b$12$cMaeDxJvTrsDer/m.6yhtOCBmc0thkFvLG.k8R8cVaGyAws6AIP5e',created_at:'2026-02-07T16:24:39.394025+00:00'},{id:'user-2',username:'Ian Miller',email:'richyestas@gmail.com',role:'admin',password_hash:'$2b$12$Ig4d0UpRZttu5cfDbs.xieTkK5ZRVkFdR3cBBVj9cORlwRxx00oSy',created_at:'2025-11-06T22:11:41.126547+00:00'}])"
echo    Done!

echo [2/7] Importing Settings...
mongo test_database --eval "db.settings.deleteMany({})"
mongo test_database --eval "db.settings.insertOne({id:'app_settings',currency:'JMD',tax_enabled:false,tax_rate:0.05,business_name:'Techzone',business_address:'30 Giltress Street, Kingston 2, JA',business_phone:'(876) 843-2416 / (876) 633-9251',business_logo:'https://salestax.preview.emergentagent.com/api/uploads/logo_4b7b7a93.jpg',points_enabled:true,points_redemption_threshold:3500.0,points_value:15.0,points_per_dollar:0.002,tax_exempt_categories:['accessory'],updated_at:'2026-02-11T23:43:05.593773+00:00'})"
echo    Done!

echo [3/7] Importing Customers...
mongo test_database --eval "db.customers.deleteMany({})"
mongo test_database --eval "db.customers.insertMany([{id:'cust-1',name:'John Doe',email:'john@example.com',phone:'555-0100',address:'123 Main St',notes:'',points:0,total_spent:0,created_at:'2025-10-17T19:13:35.667000+00:00'},{id:'cust-2',name:'Jane Smith',email:'jane@example.com',phone:'555-0101',address:'456 Oak Ave',notes:'',points:0,total_spent:0,created_at:'2025-10-17T19:13:35.667000+00:00'},{id:'cust-3',name:'Richard Estas',email:'richardestas@gmail.com',phone:'876-633-9251',address:'30 giltress Street',notes:'owner',points:35,total_spent:96789.79,created_at:'2025-11-06T22:13:17.000000+00:00'},{id:'cust-4',name:'Cash Customer',email:'',phone:'',address:'',notes:'Walk-in customer',points:0,total_spent:0,created_at:'2025-11-07T00:00:00.000000+00:00'},{id:'cust-5',name:'Kemani',email:'',phone:'',address:'',notes:'',points:0,total_spent:3500,created_at:'2025-11-07T18:00:00.000000+00:00'},{id:'cust-6',name:'KeKe',email:'',phone:'',address:'',notes:'',points:0,total_spent:0,created_at:'2025-11-07T18:00:00.000000+00:00'},{id:'cust-7',name:'Michelle',email:'',phone:'',address:'',notes:'',points:0,total_spent:4000,created_at:'2025-11-11T00:00:00.000000+00:00'},{id:'cust-8',name:'Nadine Minott',email:'',phone:'',address:'Portmore',notes:'',points:0,total_spent:4500,created_at:'2025-11-11T00:00:00.000000+00:00'},{id:'cust-9',name:'Kevin Barrett',email:'',phone:'8763616078',address:'',notes:'',points:0,total_spent:7000,created_at:'2025-11-11T00:00:00.000000+00:00'},{id:'cust-10',name:'Test Customer',email:'test@test.com',phone:'555-1234',address:'Test Address',notes:'',points:0,total_spent:0,created_at:'2025-11-12T00:00:00.000000+00:00'}])"
echo    Done!

echo [4/7] Importing Coupons...
mongo test_database --eval "db.coupons.deleteMany({})"
mongo test_database --eval "db.coupons.insertMany([{id:'coupon-1',code:'SAVE10',description:'10%% off your purchase',discount_type:'percentage',discount_value:10,min_purchase:0,max_uses:100,current_uses:2,valid_from:'2025-11-12T00:00:00.000000+00:00',valid_until:'2025-12-31T23:59:59.000000+00:00',is_active:true,created_at:'2025-11-12T19:14:17.000000+00:00'},{id:'coupon-2',code:'FLAT500',description:'$500 off orders over $5000',discount_type:'fixed',discount_value:500,min_purchase:5000,max_uses:50,current_uses:0,valid_from:'2025-11-12T00:00:00.000000+00:00',valid_until:'2025-12-31T23:59:59.000000+00:00',is_active:true,created_at:'2025-11-12T19:15:42.000000+00:00'},{id:'coupon-3',code:'TEST10',description:'Test coupon 10%% off',discount_type:'percentage',discount_value:10,min_purchase:0,max_uses:100,current_uses:2,valid_from:'2025-01-01T00:00:00.000000+00:00',valid_until:'2027-12-31T23:59:59.000000+00:00',is_active:true,created_at:'2025-11-12T20:24:15.000000+00:00'}])"
echo    Done!

echo [5/7] Importing Sample Inventory (10 items)...
mongo test_database --eval "db.inventory.deleteMany({})"
mongo test_database --eval "db.inventory.insertMany([{id:'inv-1',name:'iPhone XR Screen',type:'Screen',sku:'IPXR-SCR-001',quantity:6,cost_price:45.0,selling_price:90.0,supplier:'Tech Parts Inc',low_stock_threshold:1,created_at:'2025-10-17T19:13:35.667453+00:00'},{id:'inv-2',name:'Samsung Galaxy S21',type:'phone',sku:'SGS21-001',quantity:6,cost_price:400.0,selling_price:650.0,supplier:'Rainbow Electronics',low_stock_threshold:3,created_at:'2025-10-17T19:13:35.667469+00:00'},{id:'inv-3',name:'SAMSUNG AO3 CORE',type:'part',sku:'SM-A03C',quantity:9,cost_price:850.0,selling_price:3500.0,supplier:'CANDICE CHINA LADY',low_stock_threshold:3,created_at:'2025-11-06T22:16:04.791872+00:00'},{id:'inv-4',name:'SAM-A04',type:'part',sku:'SM-04',quantity:8,cost_price:850.0,selling_price:3500.0,supplier:'CANDICE CHINA',low_stock_threshold:3,created_at:'2025-11-06T22:22:16.698642+00:00'},{id:'inv-5',name:'SAM-05',type:'part',sku:'SM+05',quantity:18,cost_price:900.0,selling_price:4000.0,supplier:'CANDICE CHINA LADY',low_stock_threshold:5,created_at:'2025-11-06T22:24:35.916971+00:00'},{id:'inv-6',name:'Car Charger',type:'other',sku:'C-Char1',quantity:4,cost_price:400.0,selling_price:1500.0,supplier:'Peter Phone shop',low_stock_threshold:2,created_at:'2025-11-06T22:25:36.969144+00:00'},{id:'inv-7',name:'SAM-A10',type:'part',sku:'SM-10',quantity:5,cost_price:500.0,selling_price:3500.0,supplier:'CANDICE CHINA LADY',low_stock_threshold:2,created_at:'2025-11-06T22:30:40.132947+00:00'},{id:'inv-8',name:'USB Cable',type:'other',sku:'USB-001',quantity:50,cost_price:2.5,selling_price:5.99,supplier:'Cable Supplies Inc',low_stock_threshold:10,created_at:'2025-11-12T19:08:03.008288+00:00'},{id:'inv-9',name:'CR2032 Battery',type:'accessory',sku:'CR-2032',quantity:49,cost_price:100.0,selling_price:300.0,supplier:'',low_stock_threshold:5,created_at:'2026-02-11T19:27:16.129522+00:00'},{id:'inv-10',name:'AA Battery',type:'accessory',sku:'AA-Bat',quantity:18,cost_price:100.0,selling_price:300.0,supplier:'',low_stock_threshold:4,created_at:'2026-02-11T19:27:16.427435+00:00'}])"
echo    Done!

echo [6/7] Importing Repair Jobs...
mongo test_database --eval "db.repair_jobs.deleteMany({})"
mongo test_database --eval "db.repair_jobs.insertMany([{id:'repair-1',customer_name:'Test Customer',device_type:'iPhone 12',issue_description:'Screen replacement',status:'pending',cost:150.0,created_at:'2025-11-12T00:00:00.000000+00:00'}])"
echo    Done!

echo [7/7] Clearing activation data for fresh start...
mongo test_database --eval "db.activated_devices.deleteMany({})"
mongo test_database --eval "db.activation_codes.deleteMany({})"
echo    Done!

echo.
echo ================================================
echo Import Complete!
echo ================================================
echo.
echo You can now login with:
echo   Username: admin
echo   Password: admin123
echo.
echo Or use:
echo   Username: Ian Miller  
echo   Password: admin123
echo.
pause
