using AI.SupportWorkspace.ClipboardCompanion.Security;
using System.Reflection;

namespace AI.SupportWorkspace.ClipboardCompanion.Tests;

public sealed class InvocationTests
{
    private const string Origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop/";

    [Fact]
    public void ExactOriginAndParentWindowPass()
    {
        Assert.True(InvocationValidator.TryValidate([Origin, "--parent-window=0"], Origin, out ValidatedInvocation? result));
        Assert.Equal(nint.Zero, result!.ChromeParentWindow);
    }

    [Fact]
    public void DefaultDevelopmentArtifactEmbedsFailClosedUnconfiguredOrigin()
    {
        AssemblyMetadataAttribute attribute = typeof(HostProcess).Assembly
            .GetCustomAttributes<AssemblyMetadataAttribute>()
            .Single(value => value.Key == "ExpectedExtensionOrigin");
        Assert.Equal(string.Empty, attribute.Value);
        Assert.False(InvocationValidator.IsValidConfiguredOrigin(attribute.Value!));
    }

    [Fact]
    public void NonzeroParentIsParsedButNotAnOwnershipChoice()
    {
        Assert.True(InvocationValidator.TryValidate([Origin, "--parent-window=12345"], Origin, out ValidatedInvocation? result));
        Assert.Equal((nint)12345, result!.ChromeParentWindow);
    }

    [Theory]
    [InlineData("")]
    [InlineData("*")]
    [InlineData("chrome-extension://*/")]
    [InlineData("chrome-extension://abcdefghijklmnopabcdefghijklmnop")]
    [InlineData("https://abcdefghijklmnopabcdefghijklmnop/")]
    [InlineData("chrome-extension://zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz/")]
    public void InvalidOrUnconfiguredBuildOriginFailsClosed(string configured) =>
        Assert.False(InvocationValidator.TryValidate([Origin, "--parent-window=0"], configured, out _));

    [Fact]
    public void WrongOriginFails() => Assert.False(InvocationValidator.TryValidate(
        ["chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/", "--parent-window=0"], Origin, out _));

    [Theory]
    [InlineData("--parent-window=")]
    [InlineData("--parent-window=-1")]
    [InlineData("--parent-window=abc")]
    [InlineData("--other=0")]
    public void MalformedArgumentsFail(string argument) =>
        Assert.False(InvocationValidator.TryValidate([Origin, argument], Origin, out _));

    [Fact]
    public void ExtraArgumentsFail() => Assert.False(InvocationValidator.TryValidate(
        [Origin, "--parent-window=0", "extra"], Origin, out _));
}
