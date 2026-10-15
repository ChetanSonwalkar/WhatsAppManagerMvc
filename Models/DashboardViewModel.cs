
namespace WhatsAppManagerMvc.Models;

public class DashboardViewModel
{
    public List<WhatsAppTemplate> Templates { get; set; } = new();
    public List<WhatsAppMessage> Messages { get; set; } = new();
    public int TotalMessages { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public string? Status { get; set; }
    public string? Notice { get; set; }
    public string? Error { get; set; }

    public int TotalPages =>
        Math.Max(1, (int)Math.Ceiling(
            TotalMessages / (double)PageSize));
}
