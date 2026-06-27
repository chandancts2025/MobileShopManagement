using FluentValidation;
using MobileShop.Application.DTOs.Billing;
using MobileShop.Application.DTOs.Products;
using MobileShop.Application.DTOs.Orders;
using MobileShop.Application.DTOs.Common;

namespace MobileShop.Api.Validation;

public class CreateReviewValidator : AbstractValidator<CreateReviewRequest>
{
    public CreateReviewValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required");

        RuleFor(x => x.Rating)
            .GreaterThanOrEqualTo(1)
            .LessThanOrEqualTo(5)
            .WithMessage("Rating must be between 1 and 5");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Review title is required")
            .MaximumLength(200).WithMessage("Review title cannot exceed 200 characters");

        RuleFor(x => x.Comment)
            .NotEmpty().WithMessage("Review comment is required")
            .MaximumLength(2000).WithMessage("Review comment cannot exceed 2000 characters");

        RuleFor(x => x.ImageUrls)
            .Must(x => x == null || x.Count <= 5).WithMessage("Maximum 5 images allowed");
    }
}

public class AddToWishlistValidator : AbstractValidator<AddToWishlistRequest>
{
    public AddToWishlistValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required");

        RuleFor(x => x.NotifyAtPrice)
            .GreaterThan(0)
            .When(x => x.NotifyAtPrice.HasValue)
            .WithMessage("Notify at price must be greater than 0");
    }
}

public class SendNotificationValidator : AbstractValidator<SendNotificationRequest>
{
    public SendNotificationValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Message is required")
            .MaximumLength(1000).WithMessage("Message cannot exceed 1000 characters");
    }
}

public class RedeemPointsValidator : AbstractValidator<RedeemPointsRequest>
{
    public RedeemPointsValidator()
    {
        RuleFor(x => x.PointsToRedeem)
            .GreaterThan(0)
            .WithMessage("Points to redeem must be greater than 0");
    }
}

public class BillItemRequestValidator : AbstractValidator<BillItemRequest>
{
    public BillItemRequestValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Bill item description is required")
            .MaximumLength(500).WithMessage("Bill item description cannot exceed 500 characters");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Bill item quantity must be greater than zero");

        RuleFor(x => x.UnitPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Bill item unit price must be greater than or equal to zero");
    }
}

public class CreateBillRequestValidator : AbstractValidator<CreateBillRequest>
{
    public CreateBillRequestValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Order ID is required");

        RuleFor(x => x.DueAtUtc)
            .GreaterThan(DateTime.UtcNow.AddYears(-1))
            .When(x => x.DueAtUtc.HasValue)
            .WithMessage("Due date must be valid");

        RuleForEach(x => x.Items)
            .SetValidator(new BillItemRequestValidator());

        RuleFor(x => x.DiscountAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.DiscountAmount.HasValue)
            .WithMessage("Discount amount must be greater than or equal to zero");

        RuleFor(x => x.TaxAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.TaxAmount.HasValue)
            .WithMessage("Tax amount must be greater than or equal to zero");
    }
}

public class UpdateBillRequestValidator : AbstractValidator<UpdateBillRequest>
{
    public UpdateBillRequestValidator()
    {
        RuleFor(x => x.DueAtUtc)
            .GreaterThan(DateTime.UtcNow.AddYears(-1))
            .When(x => x.DueAtUtc.HasValue)
            .WithMessage("Due date must be valid");

        RuleForEach(x => x.Items)
            .SetValidator(new BillItemRequestValidator());

        RuleFor(x => x.DiscountAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.DiscountAmount.HasValue)
            .WithMessage("Discount amount must be greater than or equal to zero");

        RuleFor(x => x.TaxAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.TaxAmount.HasValue)
            .WithMessage("Tax amount must be greater than or equal to zero");
    }
}
