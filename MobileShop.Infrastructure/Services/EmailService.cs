using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Infrastructure.Configuration;

namespace MobileShop.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<SmtpSettings> options, ILogger<EmailService> logger)
    {
        _settings = options.Value;
        _logger = logger;
    }

    public async Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber, decimal totalAmount, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2 style=""color: #0f172a; margin-top: 0;"">🎉 Order Confirmation</h2>
            <p>Dear <strong>{customerName}</strong>,</p>
            <p>Thank you for choosing Mobile Shop! Your order has been placed successfully and is currently being processed.</p>
            <div style=""background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;"">
                <p style=""margin: 4px 0;""><strong>Order Number:</strong> <span style=""color: #2563eb;"">{orderNumber}</span></p>
                <p style=""margin: 4px 0;""><strong>Total Amount:</strong> <span style=""font-size: 1.1rem; color: #16a34a; font-weight: bold;"">₹{totalAmount:N2}</span></p>
                <p style=""margin: 4px 0;""><strong>Status:</strong> <span style=""color: #d97706; font-weight: 600;"">Confirmed &bull; Processing</span></p>
            </div>
            <p>You can track the progress of your order online anytime via our website.</p>
            <p style=""margin-top: 24px;"">Warm regards,<br><strong>Mobile Shop Team</strong></p>
        ";

        await SendEmailAsync(toEmail, $"Order Confirmation - #{orderNumber}", htmlBody, cancellationToken);
    }

    public async Task SendOrderStatusUpdateAsync(string toEmail, string customerName, string orderNumber, string status, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2 style=""color: #0f172a; margin-top: 0;"">📦 Order Status Update</h2>
            <p>Dear <strong>{customerName}</strong>,</p>
            <p>Your order status has been updated.</p>
            <div style=""background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;"">
                <p style=""margin: 4px 0;""><strong>Order Number:</strong> <span style=""color: #2563eb;"">{orderNumber}</span></p>
                <p style=""margin: 4px 0;""><strong>New Status:</strong> <span style=""color: #16a34a; font-weight: bold;"">{status}</span></p>
            </div>
            <p>Thank you for shopping with us!</p>
        ";

        await SendEmailAsync(toEmail, $"Update on Order #{orderNumber}: {status}", htmlBody, cancellationToken);
    }

    public async Task SendPaymentReceiptAsync(string toEmail, string customerName, string invoiceNumber, decimal amount, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2 style=""color: #0f172a; margin-top: 0;"">🧾 Payment Receipt</h2>
            <p>Dear <strong>{customerName}</strong>,</p>
            <p>We have successfully received your payment.</p>
            <div style=""background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;"">
                <p style=""margin: 4px 0;""><strong>Invoice / Bill Number:</strong> {invoiceNumber}</p>
                <p style=""margin: 4px 0;""><strong>Amount Paid:</strong> <span style=""color: #16a34a; font-weight: bold;"">₹{amount:N2}</span></p>
                <p style=""margin: 4px 0;""><strong>Date:</strong> {DateTime.UtcNow:dd-MMM-yyyy HH:mm} UTC</p>
            </div>
            <p>Thank you for your business!</p>
        ";

        await SendEmailAsync(toEmail, $"Payment Receipt - {invoiceNumber}", htmlBody, cancellationToken);
    }

    public async Task SendPasswordResetAsync(string toEmail, string resetLink, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2 style=""color: #0f172a; margin-top: 0;"">🔐 Password Reset Request</h2>
            <p>We received a request to reset your password. Click the button below to choose a new password:</p>
            <div style=""text-align: center; margin: 24px 0;"">
                <a href=""{resetLink}"" style=""background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"">Reset My Password</a>
            </div>
            <p style=""color: #64748b; font-size: 0.85rem;"">This link will expire in 24 hours. If you did not request this, you can safely ignore this email.</p>
        ";

        await SendEmailAsync(toEmail, "Password Reset Request - Mobile Shop", htmlBody, cancellationToken);
    }

    public async Task SendReviewApprovalNotificationAsync(string toEmail, string customerName, string productName, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2 style=""color: #0f172a; margin-top: 0;"">⭐ Review Approved!</h2>
            <p>Dear <strong>{customerName}</strong>,</p>
            <p>Great news! Your review for <strong>{productName}</strong> has been approved by our team and is now live on our store catalog.</p>
            <p>Thank you for helping other customers make informed decisions with your valuable feedback!</p>
        ";

        await SendEmailAsync(toEmail, $"Your Review for '{productName}' is Now Live!", htmlBody, cancellationToken);
    }

    public async Task SendLowStockAlertAsync(string toEmail, string productName, int currentStock, int reorderLevel, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2 style=""color: #dc2626; margin-top: 0;"">⚠️ Low Stock Alert</h2>
            <p>The inventory level for the following item has dropped to or below its reorder threshold:</p>
            <div style=""background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;"">
                <p style=""margin: 4px 0;""><strong>Product:</strong> {productName}</p>
                <p style=""margin: 4px 0;""><strong>Current Quantity:</strong> <span style=""color: #dc2626; font-weight: bold;"">{currentStock} units</span></p>
                <p style=""margin: 4px 0;""><strong>Reorder Level:</strong> {reorderLevel} units</p>
            </div>
            <p>Please review and initiate a new Purchase Order to restock as soon as possible.</p>
        ";

        await SendEmailAsync(toEmail, $"[ALERT] Low Stock Warning: {productName}", htmlBody, cancellationToken);
    }

    public async Task SendRepairTicketNotificationAsync(string toEmail, string customerName, string ticketNumber, string device, string status, decimal estimatedCost, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2 style=""color: #0f172a; margin-top: 0;"">🔧 Mobile Repair Service Update</h2>
            <p>Dear <strong>{customerName}</strong>,</p>
            <p>Here is the latest update regarding your mobile repair service ticket:</p>
            <div style=""background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;"">
                <p style=""margin: 4px 0;""><strong>Ticket Number:</strong> <span style=""color: #2563eb; font-weight: bold;"">{ticketNumber}</span></p>
                <p style=""margin: 4px 0;""><strong>Device:</strong> {device}</p>
                <p style=""margin: 4px 0;""><strong>Status:</strong> <span style=""color: #16a34a; font-weight: bold;"">{status}</span></p>
                <p style=""margin: 4px 0;""><strong>Estimated Cost:</strong> ₹{estimatedCost:N2}</p>
            </div>
            <p>You can track real-time repair progress anytime on our website using your ticket number or phone number.</p>
        ";

        await SendEmailAsync(toEmail, $"Repair Ticket {ticketNumber} - Status: {status}", htmlBody, cancellationToken);
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string customerName, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2 style=""color: #0f172a; margin-top: 0;"">👋 Welcome to Mobile Shop!</h2>
            <p>Dear <strong>{customerName}</strong>,</p>
            <p>Welcome to Mobile Shop Management System. Your customer account has been created successfully.</p>
            <p>You can now:</p>
            <ul>
                <li>Explore our latest smartphones, tablets, and accessories</li>
                <li>Add items to your Wishlist with real-time price drop notifications</li>
                <li>Earn loyalty rewards and points on every purchase</li>
                <li>Track online orders and device repairs effortlessly</li>
            </ul>
            <p>We are glad to have you with us!</p>
        ";

        await SendEmailAsync(toEmail, "Welcome to Mobile Shop!", htmlBody, cancellationToken);
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            _logger.LogWarning("Email recipient address was empty; skipping email with subject: {Subject}", subject);
            return;
        }

        if (_settings.DevMode)
        {
            _logger.LogInformation("[DEV MODE EMAIL] Recipient: {ToEmail} | Subject: {Subject}", toEmail, subject);
            return;
        }

        try
        {
            // Enforce a strict 4-second timeout so outbound SMTP failures/blocked ports never hang the application
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(4));

            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                EnableSsl = _settings.EnableSsl,
                Credentials = new NetworkCredential(_settings.UserName, _settings.Password),
                DeliveryMethod = SmtpDeliveryMethod.Network,
                Timeout = 4000
            };

            var fromAddress = new MailAddress(_settings.FromEmail, _settings.FromName);
            var toAddress = new MailAddress(toEmail);

            using var message = new MailMessage(fromAddress, toAddress)
            {
                Subject = subject,
                Body = BuildStyledHtmlEmail(subject, htmlBody),
                IsBodyHtml = true
            };

            await client.SendMailAsync(message, timeoutCts.Token);
            _logger.LogInformation("Email successfully dispatched to {ToEmail} with subject: '{Subject}'", toEmail, subject);
        }
        catch (OperationCanceledException)
        {
            _logger.LogWarning("Email dispatch to {ToEmail} timed out after 4s (likely outbound SMTP port filtered/blocked on host).", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail} with subject: '{Subject}'", toEmail, subject);
        }
    }

    public async Task SendBulkEmailAsync(List<string> recipients, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        var tasks = recipients
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Distinct()
            .Select(email => SendEmailAsync(email, subject, htmlBody, cancellationToken));

        await Task.WhenAll(tasks);
    }

    private static string BuildStyledHtmlEmail(string title, string content)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <title>{title}</title>
</head>
<body style=""margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;"">
    <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"">
        <!-- Header -->
        <tr>
            <td style=""background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px 32px; text-align: left;"">
                <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"">
                    <tr>
                        <td>
                            <h1 style=""color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;"">📱 Mobile Shop Management</h1>
                            <p style=""color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;"">Retail, Repairs & Customer Operations</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <!-- Main Content -->
        <tr>
            <td style=""padding: 32px;"">
                {content}
            </td>
        </tr>
        <!-- Footer -->
        <tr>
            <td style=""background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #64748b; line-height: 1.5;"">
                <p style=""margin: 0 0 4px 0;""><strong>Mobile Shop Management</strong> &bull; Proprietor: Chandan Kr Mandal</p>
                <p style=""margin: 0 0 4px 0;"">📍 3B8-2D, Sanhita Township, Newtown, 700135, WB &bull; 📞 +91 9851632391</p>
                <p style=""margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;"">This is an automated service notification regarding your Mobile Shop account or transaction.</p>
            </td>
        </tr>
    </table>
</body>
</html>";
    }
}
