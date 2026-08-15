using AI.SupportWorkspace.ClipboardCompanion.Clipboard;

namespace AI.SupportWorkspace.ClipboardCompanion.Tests;

public sealed class NativeBoundaryTests
{
    [Fact]
    public void CompanionCreatesAnUnshownProcessOwnedNonNullTopLevelWindow()
    {
        nint createdHandle = nint.Zero;
        nint disposedHandle = (nint)(-1);
        Exception? failure = null;
        var thread = new Thread(() =>
        {
            try
            {
                using ICompanionWindow window = new CompanionWindowFactory().Create();
                createdHandle = window.Handle;
                Assert.NotEqual(nint.Zero, createdHandle);
                Assert.False(IsWindowVisible(createdHandle));
                window.Dispose();
                disposedHandle = window.Handle;
            }
            catch (Exception exception)
            {
                failure = exception;
            }
        });
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        thread.Join();
        if (failure is not null)
        {
            throw failure;
        }

        Assert.NotEqual(nint.Zero, createdHandle);
        Assert.Equal(nint.Zero, disposedHandle);
    }

    [System.Runtime.InteropServices.DllImport("user32.dll")]
    [return: System.Runtime.InteropServices.MarshalAs(System.Runtime.InteropServices.UnmanagedType.Bool)]
    private static extern bool IsWindowVisible(nint window);
}
