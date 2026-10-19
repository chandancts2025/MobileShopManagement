$login = Invoke-RestMethod -Uri "http://localhost:5268/api/auth/login" -Method Post -Body (@{ email = "chandankr.mandal87@gmail.com"; password = "SuperAdmin@123" } | ConvertTo-Json) -ContentType "application/json"
$headers = @{ Authorization = "Bearer $($login.accessToken)" }
$bill = Invoke-RestMethod -Uri "http://localhost:5268/api/billing/a7c743d5-39d4-4924-be76-132ca05a8dfb" -Method Get -Headers $headers
Write-Host "Bill Number: $($bill.billNumber)"
Write-Host "Subtotal: $($bill.subtotal)"
Write-Host "DiscountAmount: $($bill.discountAmount)"
Write-Host "TaxAmount: $($bill.taxAmount)"
Write-Host "TotalAmount: $($bill.totalAmount)"
Write-Host "BalanceDue: $($bill.balanceDue)"
Write-Host "Items:"
foreach ($item in $bill.items) {
    Write-Host "  - $($item.description) | Qty: $($item.quantity) | UnitPrice: $($item.unitPrice) | Total: $($item.totalAmount)"
}
