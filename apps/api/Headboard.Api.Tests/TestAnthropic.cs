using Microsoft.Extensions.DependencyInjection;

namespace Headboard.Api.Tests;

internal static class TestAnthropic
{
    /// <summary>Placeholder until the AnthropicClient exists (Task 5); swaps the named client's primary handler.</summary>
    public static void Register(IServiceCollection services, HttpMessageHandler handler)
    {
        services.AddHttpClient("anthropic").ConfigurePrimaryHttpMessageHandler(() => handler);
    }
}
