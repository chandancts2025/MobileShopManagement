using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Infrastructure.Services;

public class EmailService : IEmailService
{
    // TODO: Integrate with SendGrid, Mailgun, or SMTP
    // For now, this is a placeholder implementation

    public Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber, decimal totalAmount, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2>Order Confirmation</h2>
            <p>Dear {customerName},</p>
            <p>Your order #{orderNumber} has been confirmed.</p>
            <p><strong>Total Amount: ${totalAmount:F2}</strong></p>
            <p>We'll notify you when your order ships.</p>
            <p>Thank you for your purchase!</p>
        ";

        return SendEmailAsync(toEmail, $"Order Confirmation #{orderNumber}", htmlBody, cancellationToken);
    }

    public Task SendPaymentReceiptAsync(string toEmail, string customerName, string invoiceNumber, decimal amount, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2>Payment Receipt</h2>
            <p>Dear {customerName},</p>
            <p>We have received your payment.</p>
            <p><strong>Invoice: {invoiceNumber}</strong></p>
            <p><strong>Amount: ${amount:F2}</strong></p>
            <p>Thank you!</p>
        ";

        return SendEmailAsync(toEmail, $"Payment Receipt - {invoiceNumber}", htmlBody, cancellationToken);
    }

    public Task SendPasswordResetAsync(string toEmail, string resetLink, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2>Reset Your Password</h2>
            <p>Click the link below to reset your password:</p>
            <p><a href='{resetLink}'>Reset Password</a></p>
            <p>This link will expire in 24 hours.</p>
        ";

        return SendEmailAsync(toEmail, "Password Reset Request", htmlBody, cancellationToken);
    }

    public Task SendReviewApprovalNotificationAsync(string toEmail, string customerName, string productName, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2>Review Approved</h2>
            <p>Dear {customerName},</p>
            <p>Your review for <strong>{productName}</strong> has been approved and is now visible to other customers.</p>
            <p>Thank you for your feedback!</p>
        ";

        return SendEmailAsync(toEmail, "Your Review Has Been Approved", htmlBody, cancellationToken);
    }

    public Task SendLowStockAlertAsync(string toEmail, string productName, int currentStock, int reorderLevel, CancellationToken cancellationToken)
    {
        var htmlBody = $@"
            <h2>Low Stock Alert</h2>
            <p><strong>Product:</strong> {productName}</p>
            <p><strong>Current Stock:</strong> {currentStock} units</p>
            <p><strong>Reorder Level:</strong> {reorderLevel} units</p>
            <p>Please consider placing a new purchase order.</p>
        ";

        return SendEmailAsync(toEmail, $"Low Stock Alert - {productName}", htmlBody, cancellationToken);
    }

    public Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        // TODO: Implement actual email sending via SendGrid, Mailgun, or SMTP
        // For now, just log
        System.Console.WriteLine($"[EMAIL] To: {toEmail}, Subject: {subject}");
        return Task.CompletedTask;
    }

    public async Task SendBulkEmailAsync(List<string> recipients, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        var tasks = recipients.Select(email => SendEmailAsync(email, subject, htmlBody, cancellationToken));
        await Task.WhenAll(tasks);
    }
}
