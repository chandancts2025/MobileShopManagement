namespace MobileShop.Api.Middleware;

/// <summary>
/// Configures Content Security Policy (CSP) and standard security headers.
/// Ensures Swagger UI can execute inline scripts, styles, fonts, and API requests without CSP errors,
/// while maintaining strict CSP on API endpoints.
/// </summary>
public class ContentSecurityPolicyMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        if (path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/openapi", StringComparison.OrdinalIgnoreCase))
        {
            // Tailored policy allowing Swagger UI inline scripts, eval, fonts, SVG icons, and local API fetch calls
            context.Response.Headers["Content-Security-Policy"] =
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src 'self' data: https://fonts.gstatic.com; " +
                "img-src 'self' data: blob: https://validator.swagger.io; " +
                "connect-src 'self' http://localhost:* https://localhost:* http://127.0.0.1:* https://*.onrender.com https://*.vercel.app ws: wss:; " +
                "object-src 'none'; " +
                "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* https://*.vercel.app https://*.onrender.com;";
        }
        else
        {
            // Standard strict CSP for all backend API routes
            context.Response.Headers["Content-Security-Policy"] =
                "default-src 'none'; " +
                "frame-ancestors 'none';";
        }

        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        await next(context);
    }
}
