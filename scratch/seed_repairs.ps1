$body = @{
    email = "chandankr.mandal87@gmail.com"
    password = "SuperAdmin@123"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "http://localhost:5266/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$headers = @{ Authorization = "Bearer $($login.accessToken)" }

$repair1 = @{
    customerName = "Rohan Sen"
    phoneNumber = "9830123456"
    deviceBrand = "Apple"
    deviceModel = "iPhone 14 Pro 128GB"
    imeiOrSerialNumber = "IMEI: 356789123456789"
    problemDescription = "Cracked Super Retina XDR display, touch working partially on top corner. No liquid ingress."
    technicianNotes = "Original OLED assembly in stock. Replaced TrueTone programmer ready."
    estimatedCost = 14500
    advanceAmount = 5000
    expectedDeliveryUtc = (Get-Date).AddDays(2).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$r1 = Invoke-RestMethod -Uri "http://localhost:5266/api/repairs" -Method Post -Headers $headers -Body $repair1 -ContentType "application/json"
Write-Host "Created Repair 1: $($r1.ticketNumber)"

$repair2 = @{
    customerName = "Priyanka Dey"
    phoneNumber = "9874561230"
    deviceBrand = "Samsung"
    deviceModel = "Galaxy S23 5G"
    imeiOrSerialNumber = "IMEI: 359123456789012"
    problemDescription = "Battery draining fast, phone overheating during fast charging. Back cover adhesive loose."
    technicianNotes = "Battery health 74%. 3900mAh genuine Samsung replacement scheduled."
    estimatedCost = 3200
    advanceAmount = 1000
    expectedDeliveryUtc = (Get-Date).AddDays(1).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$r2 = Invoke-RestMethod -Uri "http://localhost:5266/api/repairs" -Method Post -Headers $headers -Body $repair2 -ContentType "application/json"
Write-Host "Created Repair 2: $($r2.ticketNumber)"
