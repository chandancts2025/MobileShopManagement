$body = @{
    email = "chandankr.mandal87@gmail.com"
    password = "SuperAdmin@123"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "http://localhost:5268/api/auth/login" -Method Post -Body $body -ContentType "application/json"
Write-Host "Logged in as: $($login.email) | Role: $($login.role) | AccessToken length: $($login.accessToken.Length)"

$headers = @{
    Authorization = "Bearer $($login.accessToken)"
}

$bills = Invoke-RestMethod -Uri "http://localhost:5268/api/billing" -Method Get -Headers $headers
Write-Host "Bills count: $($bills.items.Count)"
foreach ($b in $bills.items) {
    Write-Host "  - Bill: $($b.billNumber) | Customer: $($b.customerName) | Total: $($b.totalAmount) | BalanceDue: $($b.balanceDue)"
}

$repairs = Invoke-RestMethod -Uri "http://localhost:5268/api/repairs" -Method Get -Headers $headers
Write-Host "Repairs count: $($repairs.items.Count)"
foreach ($r in $repairs.items) {
    Write-Host "  - Repair: $($r.ticketNumber) | Device: $($r.deviceBrand) $($r.deviceModel) | Customer: $($r.customerName) | Cost: $($r.estimatedCost)"
}
