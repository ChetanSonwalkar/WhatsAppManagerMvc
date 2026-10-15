
using Microsoft.AspNetCore.Mvc;
using WhatsAppManagerMvc.Models;
using WhatsAppManagerMvc.Services;

namespace WhatsAppManagerMvc.Controllers;

public class DashboardController : Controller
{
    private readonly WhatsAppApiService _api;

    public DashboardController(WhatsAppApiService api)
    {
        _api = api;
    }

    [HttpGet]
    public async Task<IActionResult> Index(
        CancellationToken cancellationToken = default)
    {
        var model = new DashboardViewModel();

        try
        {
            model.Templates = await _api.GetTemplatesAsync(
                cancellationToken);
        }
        catch (Exception ex)
        {
            model.Error = ex.Message;
        }

        model.Notice = TempData["Notice"] as string;
        model.Error ??= TempData["Error"] as string;

        return View(model);
    }

    [HttpGet]
    public async Task<IActionResult> MessageHistory(
        string? search,
        string? status,
        int page = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);

        if (pageSize is not (10 or 25 or 50))
            pageSize = 10;

        var model = new DashboardViewModel
        {
            Search = search,
            Status = status,
            Page = page,
            PageSize = pageSize
        };

        try
        {
            var messages = await _api.GetMessagesAsync(
                cancellationToken);

            var query = messages.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(x =>
                    x.Id.ToString().Contains(
                        search, StringComparison.OrdinalIgnoreCase) ||
                    (x.PhoneNumber?.Contains(
                        search, StringComparison.OrdinalIgnoreCase) ?? false) ||
                    (x.CandidateName?.Contains(
                        search, StringComparison.OrdinalIgnoreCase) ?? false));
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                query = query.Where(x =>
                    string.Equals(
                        x.Status,
                        status,
                        StringComparison.OrdinalIgnoreCase));
            }

            var filtered = query
                .OrderByDescending(x => x.Id)
                .ToList();

            model.TotalMessages = filtered.Count;

            model.Messages = filtered
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();
        }
        catch (Exception ex)
        {
            model.Error = ex.Message;
        }

        model.Notice = TempData["Notice"] as string;
        model.Error ??= TempData["Error"] as string;

        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [RequestSizeLimit(52428800)]
    public async Task<IActionResult> SendBulk(
        int templateId,
        IFormFile? recipientFile,
        IFormFile? headerImage,
        CancellationToken cancellationToken)
    {
        if (templateId <= 0)
        {
            TempData["Error"] = "Select a WhatsApp template.";
            return RedirectToAction(nameof(Index));
        }

        if (recipientFile == null || recipientFile.Length == 0)
        {
            TempData["Error"] = "Select a recipient file.";
            return RedirectToAction(nameof(Index));
        }

        var extension =
            Path.GetExtension(recipientFile.FileName).ToLowerInvariant();

        if (extension is not (".xlsx" or ".xls" or ".csv" or ".tsv"))
        {
            TempData["Error"] = "Unsupported recipient file type.";
            return RedirectToAction(nameof(Index));
        }

        if (headerImage is { Length: > 0 })
        {
            var imageExtension =
                Path.GetExtension(headerImage.FileName).ToLowerInvariant();

            if (imageExtension is not (".jpg" or ".jpeg" or ".png"))
            {
                TempData["Error"] =
                    "Only JPG and PNG images are supported.";

                return RedirectToAction(nameof(Index));
            }

            if (headerImage.Length > 5 * 1024 * 1024)
            {
                TempData["Error"] =
                    "Header image size must not exceed 5 MB.";

                return RedirectToAction(nameof(Index));
            }
        }

        try
        {
            var result = await _api.SendBulkAsync(
                templateId,
                recipientFile,
                headerImage,
                cancellationToken);

            TempData["Notice"] = result;
        }
        catch (Exception ex)
        {
            TempData["Error"] = ex.Message;
        }

        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public async Task<IActionResult> MessageDetails(
        string phoneNumber,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return BadRequest("Phone number is required.");

        ViewBag.PhoneNumber = phoneNumber;

        try
        {
            var messages = await _api.GetMessagesByPhoneAsync(
                phoneNumber,
                cancellationToken);

            return View(messages);
        }
        catch (Exception ex)
        {
            ViewBag.Error = ex.Message;
            return View(new List<WhatsAppMessage>());
        }
    }
}
