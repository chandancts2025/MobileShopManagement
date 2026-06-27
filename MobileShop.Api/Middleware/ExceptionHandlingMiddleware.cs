using System.Net;
using System.Text.Json;

namespace MobileShop.Api.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Business rule violation");
            await WriteProblemDetailsAsync(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await WriteProblemDetailsAsync(context, HttpStatusCode.InternalServerError, "An unexpected error occurred.");
        }
    }

    private static async Task WriteProblemDetailsAsync(HttpContext context, HttpStatusCode statusCode, string detail)
    {
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var payload = new
        {
            title = statusCode == HttpStatusCode.BadRequest ? "Request could not be processed" : "Server error",
            status = (int)statusCode,
            detail
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
}
