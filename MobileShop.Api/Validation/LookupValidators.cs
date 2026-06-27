using FluentValidation;
using MobileShop.Application.DTOs.Common;
using MobileShop.Application.DTOs.Expenses;
using MobileShop.Application.DTOs.Pricing;
using MobileShop.Application.DTOs.Repairs;
using MobileShop.Application.DTOs.Settings;
using MobileShop.Application.DTOs.Suppliers;
using MobileShop.Application.DTOs.Users;

namespace MobileShop.Api.Validation;

public class UpsertLookupRequestValidator : AbstractValidator<UpsertLookupRequest>
{
    public UpsertLookupRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
    }
}

public class UpsertTaxRuleRequestValidator : AbstractValidator<UpsertTaxRuleRequest>
{
    public UpsertTaxRuleRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty();
        RuleFor(x => x.Percentage).InclusiveBetween(0, 100);
    }
}

public class UpsertPromoCodeRequestValidator : AbstractValidator<UpsertPromoCodeRequest>
{
    public UpsertPromoCodeRequestValidator()
    {
        RuleFor(x => x.Code).NotEmpty();
        RuleFor(x => x.ValidToUtc).GreaterThan(x => x.ValidFromUtc);
    }
}

public class UpsertAppSettingRequestValidator : AbstractValidator<UpsertAppSettingRequest>
{
    public UpsertAppSettingRequestValidator()
    {
        RuleFor(x => x.Key).NotEmpty();
        RuleFor(x => x.Value).NotEmpty();
    }
}

public class CreateAdminUserRequestValidator : AbstractValidator<CreateAdminUserRequest>
{
    public CreateAdminUserRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty();
        RuleFor(x => x.LastName).NotEmpty();
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.PhoneNumber).NotEmpty();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
    }
}

public class UpdateAdminUserRequestValidator : AbstractValidator<UpdateAdminUserRequest>
{
    public UpdateAdminUserRequestValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty();
        RuleFor(x => x.LastName).NotEmpty();
        RuleFor(x => x.PhoneNumber).NotEmpty();
    }
}

public class UpsertSupplierRequestValidator : AbstractValidator<UpsertSupplierRequest>
{
    public UpsertSupplierRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.PhoneNumber).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}

public class UpsertExpenseRequestValidator : AbstractValidator<UpsertExpenseRequest>
{
    public UpsertExpenseRequestValidator()
    {
        RuleFor(x => x.Category).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.PaymentMethod).NotEmpty().MaximumLength(50);
    }
}

public class CreateRepairTicketRequestValidator : AbstractValidator<CreateRepairTicketRequest>
{
    public CreateRepairTicketRequestValidator()
    {
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.PhoneNumber).NotEmpty().MaximumLength(20);
        RuleFor(x => x.DeviceBrand).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DeviceModel).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ProblemDescription).NotEmpty();
        RuleFor(x => x.EstimatedCost).GreaterThanOrEqualTo(0);
        RuleFor(x => x.AdvanceAmount).GreaterThanOrEqualTo(0);
    }
}

public class UpdateRepairTicketRequestValidator : AbstractValidator<UpdateRepairTicketRequest>
{
    public UpdateRepairTicketRequestValidator()
    {
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.PhoneNumber).NotEmpty().MaximumLength(20);
        RuleFor(x => x.DeviceBrand).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DeviceModel).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ProblemDescription).NotEmpty();
        RuleFor(x => x.EstimatedCost).GreaterThanOrEqualTo(0);
        RuleFor(x => x.AdvanceAmount).GreaterThanOrEqualTo(0);
        RuleFor(x => x.FinalAmount).GreaterThanOrEqualTo(0);
    }
}
