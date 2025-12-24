# API Examples - Inventory Email Reporting

This file contains practical examples of how to use the inventory email reporting API.

## Prerequisites

- Backend is running on `http://localhost:4000`
- You have a valid JWT token (login as admin)

## Getting a Token

```bash
# Login to get JWT token
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin"
  }'

# Response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# }

# Save the token for subsequent requests
export TOKEN="your_token_here"
```

## Merchant Management

### Create a Merchant

```bash
curl -X POST http://localhost:4000/merchants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@example.com",
    "companyName": "Smith Trading Co.",
    "receiveReports": true
  }'

# Response:
# {
#   "id": "uuid-here",
#   "name": "John Smith",
#   "email": "john.smith@example.com",
#   "companyName": "Smith Trading Co.",
#   "isActive": true,
#   "receiveReports": true,
#   "createdAt": "2025-12-24T...",
#   "updatedAt": "2025-12-24T..."
# }
```

### List All Merchants

```bash
curl http://localhost:4000/merchants \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of merchants
# [
#   {
#     "id": "uuid-1",
#     "name": "John Smith",
#     "email": "john.smith@example.com",
#     ...
#   },
#   ...
# ]
```

### Get a Specific Merchant

```bash
curl http://localhost:4000/merchants/uuid-here \
  -H "Authorization: Bearer $TOKEN"
```

### Update a Merchant

```bash
# Disable reports for a merchant
curl -X PATCH http://localhost:4000/merchants/uuid-here \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiveReports": false
  }'

# Update merchant details
curl -X PATCH http://localhost:4000/merchants/uuid-here \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "companyName": "Doe Enterprises",
    "isActive": true
  }'
```

### Delete a Merchant

```bash
curl -X DELETE http://localhost:4000/merchants/uuid-here \
  -H "Authorization: Bearer $TOKEN"
```

## Inventory Reports

### Get Inventory Summary

```bash
curl http://localhost:4000/reports/inventory-summary \
  -H "Authorization: Bearer $TOKEN"

# Response:
# [
#   {
#     "itemName": "Widget A",
#     "remainingQty": 150
#   },
#   {
#     "itemName": "Widget B",
#     "remainingQty": 75
#   },
#   ...
# ]
```

### Send Report to One Merchant

```bash
curl -X POST http://localhost:4000/reports/send-to-merchant/uuid-here \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "message": "Inventory report queued successfully",
#   "merchantId": "uuid-here"
# }
```

### Send Reports to All Active Merchants

```bash
curl -X POST http://localhost:4000/reports/send-to-all \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "message": "Inventory reports queued successfully",
#   "totalMerchants": 1000,
#   "queued": 950
# }
```

### Get Report Statistics

```bash
curl http://localhost:4000/reports/stats \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "totalMerchants": 1000,
#   "activeMerchants": 950,
#   "inventoryItems": 150,
#   "emailQueue": {
#     "waiting": 10,
#     "active": 5,
#     "completed": 935,
#     "failed": 0
#   }
# }
```

## Email Queue Management

### Get Queue Statistics

```bash
curl http://localhost:4000/email/queue-stats \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "waiting": 10,
#   "active": 5,
#   "completed": 985,
#   "failed": 0
# }
```

## Batch Operations

### Create Multiple Merchants (Bash Script)

```bash
#!/bin/bash

# Array of merchants to create
merchants=(
  "Alice Johnson:alice@example.com:Johnson Corp"
  "Bob Williams:bob@example.com:Williams Inc"
  "Carol Brown:carol@example.com:Brown Industries"
)

for merchant in "${merchants[@]}"; do
  IFS=':' read -r name email company <<< "$merchant"
  
  curl -X POST http://localhost:4000/merchants \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"email\": \"$email\",
      \"companyName\": \"$company\",
      \"receiveReports\": true
    }"
  
  echo ""
  sleep 0.5
done
```

### Create Multiple Merchants (PowerShell)

```powershell
# PowerShell script for Windows
$token = "your_token_here"
$baseUrl = "http://localhost:4000"

$merchants = @(
    @{ name = "Alice Johnson"; email = "alice@example.com"; company = "Johnson Corp" },
    @{ name = "Bob Williams"; email = "bob@example.com"; company = "Williams Inc" },
    @{ name = "Carol Brown"; email = "carol@example.com"; company = "Brown Industries" }
)

foreach ($merchant in $merchants) {
    $body = @{
        name = $merchant.name
        email = $merchant.email
        companyName = $merchant.company
        receiveReports = $true
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "$baseUrl/merchants" `
        -Method Post `
        -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
        -Body $body

    Start-Sleep -Milliseconds 500
}
```

## Testing Workflow

### Complete Test Workflow

```bash
#!/bin/bash

echo "=== Inventory Email Reporting Test ==="

# 1. Login
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "✓ Token obtained"

# 2. Create test merchant
echo "2. Creating test merchant..."
MERCHANT_RESPONSE=$(curl -s -X POST http://localhost:4000/merchants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Merchant",
    "email": "test@example.com",
    "companyName": "Test Company",
    "receiveReports": true
  }')

MERCHANT_ID=$(echo $MERCHANT_RESPONSE | jq -r '.id')
echo "✓ Merchant created: $MERCHANT_ID"

# 3. Check inventory summary
echo "3. Checking inventory..."
curl -s http://localhost:4000/reports/inventory-summary \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 4. Send test email
echo "4. Sending test email..."
curl -s -X POST http://localhost:4000/reports/send-to-merchant/$MERCHANT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 5. Check queue status
echo "5. Checking queue status..."
sleep 2
curl -s http://localhost:4000/email/queue-stats \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo "=== Test Complete ==="
```

## Monitoring Script

### Monitor Email Queue (Bash)

```bash
#!/bin/bash

while true; do
  clear
  echo "=== Email Queue Status ==="
  echo "Time: $(date)"
  echo ""
  
  curl -s http://localhost:4000/email/queue-stats \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  
  echo ""
  echo "Refreshing in 5 seconds... (Ctrl+C to stop)"
  sleep 5
done
```

### Monitor Email Queue (PowerShell)

```powershell
# Monitor queue status every 5 seconds
$token = "your_token_here"

while ($true) {
    Clear-Host
    Write-Host "=== Email Queue Status ===" -ForegroundColor Cyan
    Write-Host "Time: $(Get-Date)" -ForegroundColor Gray
    Write-Host ""
    
    $stats = Invoke-RestMethod -Uri "http://localhost:4000/email/queue-stats" `
        -Headers @{ Authorization = "Bearer $token" }
    
    Write-Host "Waiting:   $($stats.waiting)" -ForegroundColor Yellow
    Write-Host "Active:    $($stats.active)" -ForegroundColor Cyan
    Write-Host "Completed: $($stats.completed)" -ForegroundColor Green
    Write-Host "Failed:    $($stats.failed)" -ForegroundColor $(if ($stats.failed -gt 0) { "Red" } else { "Gray" })
    
    Write-Host ""
    Write-Host "Refreshing in 5 seconds... (Ctrl+C to stop)" -ForegroundColor Gray
    Start-Sleep -Seconds 5
}
```

## Import CSV of Merchants

### Bash Script

```bash
#!/bin/bash

# Read CSV file and create merchants
# CSV format: name,email,company
# Example: John Doe,john@example.com,Doe Corp

INPUT_FILE="merchants.csv"

tail -n +2 "$INPUT_FILE" | while IFS=, read -r name email company; do
  echo "Creating merchant: $name"
  
  curl -X POST http://localhost:4000/merchants \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"email\": \"$email\",
      \"companyName\": \"$company\",
      \"receiveReports\": true
    }"
  
  sleep 0.3
done
```

### PowerShell Script

```powershell
# Import merchants from CSV
$token = "your_token_here"
$csv = Import-Csv "merchants.csv"

foreach ($row in $csv) {
    Write-Host "Creating merchant: $($row.name)"
    
    $body = @{
        name = $row.name
        email = $row.email
        companyName = $row.company
        receiveReports = $true
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:4000/merchants" `
        -Method Post `
        -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
        -Body $body
    
    Start-Sleep -Milliseconds 300
}
```

## Tips

1. **Always save your token** after login for subsequent requests
2. **Use `jq`** (or PowerShell's `ConvertTo-Json`) for pretty-printing JSON responses
3. **Monitor the queue** regularly when sending to many merchants
4. **Test with small batches** (5-10 merchants) before going to production
5. **Add delays** between batch operations to avoid overwhelming the system

## Environment-Specific URLs

```bash
# Development
export API_URL="http://localhost:4000"

# Staging
export API_URL="https://staging.yourdomain.com"

# Production
export API_URL="https://api.yourdomain.com"

# Then use in curl:
curl $API_URL/merchants \
  -H "Authorization: Bearer $TOKEN"
```

---

For more examples and documentation, see:
- [SETUP_EMAIL_REPORTING.md](SETUP_EMAIL_REPORTING.md)
- [EMAIL_REPORTING.md](EMAIL_REPORTING.md)
