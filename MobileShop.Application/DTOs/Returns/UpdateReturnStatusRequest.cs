using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Returns;

public class UpdateReturnStatusRequest
{
    public ReturnStatus Status { get; set; }
}
