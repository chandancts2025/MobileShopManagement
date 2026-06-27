namespace MobileShop.Application.Interfaces.Services;

public interface IEmailService
{
    Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderNumber, decimal totalAmount, CancellationToken cancellationToken);

    Task SendPaymentReceiptAsync(string toEmail, string customerName, string invoiceNumber, decimal amount, CancellationToken cancellationToken);

    Task SendPasswordResetAsync(string toEmail, string resetLink, CancellationToken cancellationToken);

    Task SendReviewApprovalNotificationAsync(string toEmail, string customerName, string productName, CancellationToken cancellationToken);

    Task SendLowStockAlertAsync(string toEmail, string productName, int currentStock, int reorderLevel, CancellationToken cancellationToken);

    Task SendEmailAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken);

    Task SendBulkEmailAsync(List<string> recipients, string subject, string htmlBody, CancellationToken cancellationToken);
}
