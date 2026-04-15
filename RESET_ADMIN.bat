@echo off
title TechZone POS - Reset Admin User
color 0E

echo.
echo ========================================
echo   Reset Admin User
echo ========================================
echo.
echo This will reset the admin user password.
echo.
pause

cd /d "%~dp0backend"

py -c "
import bcrypt
from pymongo import MongoClient

# Connect to local MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client['salestax']

# Hash new password
password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Update or create admin user
result = db.users.update_one(
    {'username': 'admin'},
    {'$set': {
        'password_hash': password_hash,
        'role': 'admin',
        'email': 'admin@techzone.com'
    }},
    upsert=True
)

if result.modified_count > 0:
    print('Admin password reset successfully!')
elif result.upserted_id:
    print('Admin user created successfully!')
else:
    print('Admin user already exists with correct password.')

print()
print('Login credentials:')
print('  Username: admin')
print('  Password: admin123')
"

echo.
pause
