using FluentValidation;
using MobileShop.Application.DTOs.Inventory;
using MobileShop.Application.DTOs.Orders;
using MobileShop.Application.DTOs.Payments;
using MobileShop.Application.DTOs.Products;
using MobileShop.Application.DTOs.PurchaseOrders;
using MobileShop.Application.DTOs.Returns;

namespace MobileShop.Api.Validation;

public class UpsertProductRequestValidator : AbstractValidator<UpsertProductRequest>
{
    public UpsertProductRequestValidator()
    {
        RuleFor(x => x.Sku).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.BrandId).NotEmpty();
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CostPrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TaxPercentage).GreaterThanOrEqualTo(0);
        RuleFor(x => x.QuantityOnHand).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ReorderLevel).GreaterThanOrEqualTo(0);
    }
}

public class CreateOrderRequestValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.CustomerProfileId)
            .NotEmpty()
            .When(x => x.CustomerProfileId.HasValue);

        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).SetValidator(new OrderItemRequestValidator());
    }
}

public class OrderItemRequestValidator : AbstractValidator<OrderItemRequest>
{
    public OrderItemRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}

public class StockAdjustmentRequestValidator : AbstractValidator<StockAdjustmentRequest>
{
    public StockAdjustmentRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Quantity).NotEqual(0);
        RuleFor(x => x.Reason).NotEmpty();
    }
}

public class StockReceiveRequestValidator : AbstractValidator<StockReceiveRequest>
{
    public StockReceiveRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.SupplierReference).NotEmpty();
    }
}

public class CreatePaymentRequestValidator : AbstractValidator<CreatePaymentRequest>
{
    public CreatePaymentRequestValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.PaymentMethod).NotEmpty();
    }
}

public class CreateReturnRequestValidator : AbstractValidator<CreateReturnRequest>
{
    public CreateReturnRequestValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.Reason).NotEmpty();
        RuleFor(x => x.RefundAmount).GreaterThanOrEqualTo(0);
    }
}

public class UpdateReturnStatusRequestValidator : AbstractValidator<UpdateReturnStatusRequest>
{
    public UpdateReturnStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}

public class CreatePurchaseOrderRequestValidator : AbstractValidator<CreatePurchaseOrderRequest>
{
    public CreatePurchaseOrderRequestValidator()
    {
        RuleFor(x => x.SupplierId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).SetValidator(new PurchaseOrderItemRequestValidator());
    }
}

public class PurchaseOrderItemRequestValidator : AbstractValidator<PurchaseOrderItemRequest>
{
    public PurchaseOrderItemRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.QuantityOrdered).GreaterThan(0);
        RuleFor(x => x.UnitCost).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TaxPercentage).InclusiveBetween(0, 100);
    }
}

public class ReceivePurchaseOrderRequestValidator : AbstractValidator<ReceivePurchaseOrderRequest>
{
    public ReceivePurchaseOrderRequestValidator()
    {
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).SetValidator(new ReceivePurchaseOrderItemRequestValidator());
    }
}

public class ReceivePurchaseOrderItemRequestValidator : AbstractValidator<ReceivePurchaseOrderItemRequest>
{
    public ReceivePurchaseOrderItemRequestValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.QuantityReceived).GreaterThan(0);
    }
}
