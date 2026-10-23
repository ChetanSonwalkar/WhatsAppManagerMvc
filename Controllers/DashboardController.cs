
using Microsoft.AspNetCore.Mvc;
using WhatsAppManagerMvc.Models;
using WhatsAppManagerMvc.Services;
using System.Text.Json;
using System.Globalization;
using System.Net.Http.Headers;



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
    public async Task<IActionResult> MessageHistory(string? search, string? status, int page = 1, int pageSize = 10, bool ajax = false, CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);

        if (pageSize is not (10 or 25 or 50 or 100))
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
            var templates = await _api.GetTemplatesAsync(
                cancellationToken);

            ViewBag.TemplateNames = templates
                .Where(t => t.Id > 0 &&
                            !string.IsNullOrWhiteSpace(t.TemplateName))
                .GroupBy(t => t.Id)
                .ToDictionary(
                    group => group.Key,
                    group => group.First().TemplateName);

            var messages = await _api.GetMessagesAsync(
                cancellationToken);

            var query = messages.AsEnumerable();

            //if (!string.IsNullOrWhiteSpace(search))
            //{
            //    query = query.Where(x =>
            //        x.Id.ToString().Contains(
            //            search, StringComparison.OrdinalIgnoreCase) ||
            //        (x.PhoneNumber?.Contains(
            //            search, StringComparison.OrdinalIgnoreCase) ?? false) ||
            //        (x.CandidateName?.Contains(
            //            search, StringComparison.OrdinalIgnoreCase) ?? false));
            //}


            //if (!string.IsNullOrWhiteSpace(search))
            //{
            //    query = query.Where(x =>
            //        x.Id.ToString().Contains(
            //            search,
            //            StringComparison.OrdinalIgnoreCase) ||

            //        (x.PhoneNumber?.Contains(
            //            search,
            //            StringComparison.OrdinalIgnoreCase) ?? false) ||

            //        (x.CandidateName?.Contains(
            //            search,
            //            StringComparison.OrdinalIgnoreCase) ?? false) ||

            //        (x.Status?.Contains(
            //            search,
            //            StringComparison.OrdinalIgnoreCase) ?? false) ||

            //        (x.WhatsAppTemplateId.HasValue &&
            //         ViewBag.TemplateNames is Dictionary<int, string> templateNames &&
            //         templateNames.TryGetValue(
            //             x.WhatsAppTemplateId.Value,
            //             out var templateName) &&
            //         templateName.Contains(
            //             search,
            //             StringComparison.OrdinalIgnoreCase))
            //    );
            //}




            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();

                query = query.Where(x =>
                    x.Id.ToString().Contains(term, StringComparison.OrdinalIgnoreCase) ||

                    (x.PhoneNumber?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||

                    (x.CandidateName?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||

                    (x.Status?.Contains(term, StringComparison.OrdinalIgnoreCase) ?? false) ||

                    (x.WhatsAppTemplateId.HasValue &&
                     ViewBag.TemplateNames is Dictionary<int, string> templateNames &&
                     templateNames.TryGetValue(x.WhatsAppTemplateId.Value, out var templateName) &&
                     templateName.Contains(term, StringComparison.OrdinalIgnoreCase)) ||

                     DateMatches(x.CreatedAt, term) ||
                    DateMatches(x.SentAt, term) ||
                    DateMatches(x.DeliveredAt, term) ||
                    DateMatches(x.ReadAt, term) ||
                    DateMatches(x.UpdatedAt, term)
                );
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

            ViewBag.TemplateNames ??= new Dictionary<int, string>();
        }

        model.Notice = TempData["Notice"] as string;
        model.Error ??= TempData["Error"] as string;

        if (ajax)
        {
            return PartialView("_MessageHistoryResults", model);
        }

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

            if (string.IsNullOrWhiteSpace(result))
            {
                TempData["Notice"] = "Message sent successfully!";
            }
            else
            {
                using var document = JsonDocument.Parse(result);
                var root = document.RootElement;

                if (root.TryGetProperty(
                    "sentMessages", out var sentMessages) &&
                    sentMessages.ValueKind == JsonValueKind.Array)
                {
                    var sentCount = sentMessages.EnumerateArray()
                        .Count(message =>
                            message.TryGetProperty(
                                "status", out var statusElement) &&
                            string.Equals(
                                statusElement.GetString(),
                                "Sent",
                                StringComparison.OrdinalIgnoreCase));

                    var totalRecipients = root.TryGetProperty(
                        "totalRecipients", out var totalElement)
                        ? totalElement.GetInt32()
                        : sentMessages.GetArrayLength();

                    if (sentCount > 0 && sentCount == totalRecipients)
                    {
                        TempData["Notice"] = "Message sent successfully!";
                    }
                    else if (sentCount > 0)
                    {
                        TempData["Notice"] =
                            $"Messages sent: {sentCount} of {totalRecipients}.";
                    }
                    else
                    {
                        TempData["Error"] =
                            "Message could not be sent. Please check the message history.";
                    }
                }
                else
                {
                    TempData["Notice"] = "Message sent successfully!";
                }
            }
        }
        catch (JsonException)
        {
            TempData["Notice"] = "Message sent successfully!";
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




    //[HttpGet]
    //public async Task<IActionResult> WhatsAppChat(
    //    string? phoneNumber,
    //    CancellationToken cancellationToken = default)
    //{
    //    if (string.IsNullOrWhiteSpace(phoneNumber))
    //    {
    //        return BadRequest("Phone number is required.");
    //    }

    //    ViewBag.PhoneNumber = phoneNumber;

    //    try
    //    {
    //        var messages = await _api.GetMessagesByPhoneAsync(
    //            phoneNumber,
    //            cancellationToken);

    //        var templates = await _api.GetTemplatesAsync(
    //            cancellationToken);

    //        ViewBag.TemplateDetails = templates;

    //        var orderedMessages = messages
    //            .OrderBy(m => m.CreatedAt ?? m.SentAt)
    //            .ToList();

    //        return View(orderedMessages);
    //    }
    //    catch (Exception ex)
    //    {
    //        ViewBag.Error = ex.Message;
    //        ViewBag.TemplateDetails = new List<object>();

    //        return View(new List<WhatsAppMessage>());
    //    }
    //}




    [HttpGet]
    public async Task<IActionResult> WhatsAppChat(
     string phoneNumber,
     string? notice = null,
     string? error = null,
     CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            return RedirectToAction(nameof(MessageHistory));
        }

        var recipient = phoneNumber.Trim();

        ViewBag.PhoneNumber = recipient;
        ViewBag.CandidateName = recipient;
        ViewBag.Notice = notice;
        ViewBag.Error = error;

        ViewBag.TemplateImageUrls = new Dictionary<int, string>();

        try
        {
            // Load chat messages for the selected phone number.
            var chatMessages = await _api.GetChatMessagesAsync(
                recipient,
                cancellationToken);

            // Find candidate name from chat messages.
            var candidateName = chatMessages
                .Select(m => m.CandidateName)
                .FirstOrDefault(name =>
                    !string.IsNullOrWhiteSpace(name));

            // If candidate name is unavailable, search all messages.
            if (string.IsNullOrWhiteSpace(candidateName))
            {
                try
                {
                    var allMessages = await _api.GetMessagesAsync(
                        cancellationToken);

                    var normalizedPhone = NormalizePhone(recipient);

                    candidateName = allMessages
                        .Where(m =>
                            NormalizePhone(m.PhoneNumber) == normalizedPhone)
                        .Select(m => m.CandidateName)
                        .FirstOrDefault(name =>
                            !string.IsNullOrWhiteSpace(name));
                }
                catch
                {
                    // Keep the phone number as the displayed name.
                }
            }

            if (!string.IsNullOrWhiteSpace(candidateName))
            {
                ViewBag.CandidateName = candidateName;
            }

            // Load template header images.
            try
            {
                var templates = await _api.GetTemplatesAsync(
                    cancellationToken);

                ViewBag.WhatsAppTemplates = templates;

                var templateImageUrls = templates
                    .Where(t =>
                        t.Id > 0 &&
                        string.Equals(
                            t.HeaderFormat,
                            "IMAGE",
                            StringComparison.OrdinalIgnoreCase) &&
                        !string.IsNullOrWhiteSpace(t.HeaderImageUrl))
                    .GroupBy(t => t.Id)
                    .ToDictionary(
                        group => group.Key,
                        group => group.First().HeaderImageUrl!);

                ViewBag.TemplateImageUrls = templateImageUrls;
            }
            catch
            {
                // Chat messages should still display if templates fail to load.
                ViewBag.TemplateImageUrls = new Dictionary<int, string>();
            }

            // Sort messages in chronological order.
            var orderedMessages = chatMessages
                .OrderBy(m =>
                    m.CreatedAt ?? m.SentAt ?? DateTime.MinValue)
                .ToList();

            return View(orderedMessages);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            ViewBag.Error = ex.Message;

            return View(
                new List<WhatsAppMessage>());
        }
    }

    private static string NormalizePhone(string? phone)
    {
        return new string(
            (phone ?? string.Empty)
                .Where(char.IsDigit)
                .ToArray());
    }




    private static bool DateMatches(DateTime? value, string searchTerm)
    {
        if (!value.HasValue || string.IsNullOrWhiteSpace(searchTerm))
            return false;

        var date = value.Value;
        var term = searchTerm.Trim();

        var cultures = new[]
        {
        CultureInfo.InvariantCulture,
        CultureInfo.GetCultureInfo("en-IN"),
        CultureInfo.GetCultureInfo("en-US")
    };

        var dateTimeFormats = new[]
        {
        "dd MMM yyyy, hh:mm tt",
        "dd MMM yyyy hh:mm tt",
        "d MMM yyyy, hh:mm tt",
        "d MMM yyyy hh:mm tt",
        "dd MMM yyyy, h:mm tt",
        "dd MMM yyyy h:mm tt",
        "d MMM yyyy, h:mm tt",
        "d MMM yyyy h:mm tt",
        "dd MMM yyyy, HH:mm",
        "dd MMM yyyy HH:mm",
        "d MMM yyyy, HH:mm",
        "d MMM yyyy HH:mm",
        "dd-MM-yyyy HH:mm",
        "dd/MM/yyyy HH:mm",
        "dd MM yyyy HH:mm",
        "dd-MM-yyyy, hh:mm tt",
        "dd/MM/yyyy, hh:mm tt",
        "dd MM yyyy, hh:mm tt",
        "yyyy-MM-dd HH:mm",
        "yyyy-MM-ddTHH:mm:ss"
    };

        foreach (var culture in cultures)
        {
            if (DateTime.TryParseExact(
                term,
                dateTimeFormats,
                culture,
                DateTimeStyles.AllowWhiteSpaces,
                out var parsedDateTime))
            {
                return date.Date == parsedDateTime.Date
                    && date.Hour == parsedDateTime.Hour
                    && date.Minute == parsedDateTime.Minute;
            }
        }

        var dateOnlyFormats = new[]
        {
        "dd-MM-yyyy",
        "dd/MM/yyyy",
        "dd MM yyyy",
        "d-M-yyyy",
        "d/M/yyyy",
        "d M yyyy",
        "dd MMM yyyy",
        "d MMM yyyy",
        "dd MMMM yyyy",
        "d MMMM yyyy",
        "yyyy-MM-dd",
        "MM-dd-yyyy",
        "MM/dd/yyyy"
    };

        foreach (var culture in cultures)
        {
            if (DateTime.TryParseExact(
                term,
                dateOnlyFormats,
                culture,
                DateTimeStyles.AllowWhiteSpaces,
                out var parsedDate))
            {
                return date.Date == parsedDate.Date;
            }
        }

        var searchableValues = new[]
        {
        date.ToString("dd MMM yyyy, hh:mm tt", CultureInfo.InvariantCulture),
        date.ToString("dd MMM yyyy hh:mm tt", CultureInfo.InvariantCulture),
        date.ToString("dd MMM yyyy, HH:mm", CultureInfo.InvariantCulture),
        date.ToString("dd-MM-yyyy HH:mm", CultureInfo.InvariantCulture),
        date.ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture),
        date.ToString("dd MM yyyy", CultureInfo.InvariantCulture),
        date.ToString("dd-MM-yyyy", CultureInfo.InvariantCulture),
        date.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture),
        date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
    };

        return searchableValues.Any(x =>
            x.Contains(term, StringComparison.OrdinalIgnoreCase));
    }


    [HttpPost]
    [ValidateAntiForgeryToken]
    [RequestSizeLimit(10485760)]
    public async Task<IActionResult> SendReply(
        [FromForm] string? phoneNumber,
        [FromForm] string? messageType,
        [FromForm] string? text,
        [FromForm] string? caption,
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken = default)
    {
        var recipient = phoneNumber?.Trim();

        if (string.IsNullOrWhiteSpace(recipient))
        {
            return RedirectToAction(
                nameof(MessageHistory));
        }

        if (string.IsNullOrWhiteSpace(text) &&
            string.IsNullOrWhiteSpace(caption) &&
            (file == null || file.Length == 0))
        {
            return RedirectToAction(
                nameof(WhatsAppChat),
                new { phoneNumber = recipient });
        }

        try
        {
            await _api.SendReplyAsync(
                recipient,
                string.IsNullOrWhiteSpace(messageType)
                    ? "text"
                    : messageType,
                text,
                caption,
                file,
                cancellationToken);

            return RedirectToAction(
                nameof(WhatsAppChat),
                new { phoneNumber = recipient });
        }
        catch (Exception ex)
        {
            return RedirectToAction(
                nameof(WhatsAppChat),
                new
                {
                    phoneNumber = recipient,
                    error = ex.Message
                });
        }
    }




    //   [HttpGet]
    //public async Task<IActionResult> WhatsAppChat(
    //    string phoneNumber,
    //    CancellationToken cancellationToken = default)
    //{
    //    if (string.IsNullOrWhiteSpace(phoneNumber))
    //        return RedirectToAction(nameof(MessageHistory));

    //    phoneNumber = phoneNumber.Trim();

    //    ViewBag.PhoneNumber = phoneNumber;
    //    ViewBag.CandidateName = phoneNumber;

    //    try
    //    {
    //        var messages = await _api.GetChatMessagesAsync(
    //            phoneNumber,
    //            cancellationToken);

    //        var latest = messages
    //            .OrderByDescending(m =>
    //                m.CreatedAt ?? m.SentAt ?? DateTime.MinValue)
    //            .FirstOrDefault();

    //        if (!string.IsNullOrWhiteSpace(latest?.CandidateName))
    //            ViewBag.CandidateName = latest.CandidateName;

    //        return View(messages);
    //    }
    //    catch (Exception ex)
    //    {
    //        ViewBag.Error = ex.Message;
    //        return View(new List<WhatsAppMessage>());
    //    }
    //}


}
