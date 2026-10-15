
using System.Net.Http.Headers;
using System.Text.Json;
using WhatsAppManagerMvc.Models;

namespace WhatsAppManagerMvc.Services;

public class WhatsAppApiService
{
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public WhatsAppApiService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<WhatsAppTemplate>> GetTemplatesAsync(
        CancellationToken cancellationToken = default)
    {
        using var response = await _httpClient.GetAsync(
            "api/WhatsAppTemplates", cancellationToken);

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(
            cancellationToken);

        using var document = JsonDocument.Parse(json);
        var array = GetArray(document.RootElement);

        var templates = new List<WhatsAppTemplate>();

        foreach (var item in array.EnumerateArray())
        {
            var template = new WhatsAppTemplate
            {
                Id = GetInt(item, "id"),
                TemplateName = GetString(item, "templateName") ?? "",
                LanguageCode = GetString(item, "languageCode"),
                Category = GetString(item, "category"),
                IsActive = GetBool(item, "isActive", true)
            };

            templates.Add(template);
        }

        return templates;
    }

    public async Task<List<WhatsAppMessage>> GetMessagesAsync(
        CancellationToken cancellationToken = default)
    {
        using var response = await _httpClient.GetAsync(
            "api/WhatsApp/messages", cancellationToken);

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(
            cancellationToken);

        using var document = JsonDocument.Parse(json);
        var array = GetArray(document.RootElement);

        return ParseMessages(array);
    }

    public async Task<List<WhatsAppMessage>> GetMessagesByPhoneAsync(
        string phoneNumber,
        CancellationToken cancellationToken = default)
    {
        var encodedPhone = Uri.EscapeDataString(phoneNumber);

        using var response = await _httpClient.GetAsync(
            $"api/WhatsApp/messages/{encodedPhone}",
            cancellationToken);

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(
            cancellationToken);

        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;

        if (root.ValueKind == JsonValueKind.Array)
            return ParseMessages(root);

        if (root.ValueKind == JsonValueKind.Object &&
            TryGet(root, "data", out var data) &&
            data.ValueKind == JsonValueKind.Array)
        {
            return ParseMessages(data);
        }

        if (root.ValueKind == JsonValueKind.Object &&
            TryGet(root, "id", out _))
        {
            return new List<WhatsAppMessage>
            {
                ParseMessage(root)
            };
        }

        return new List<WhatsAppMessage>();
    }


    public async Task<string> SendBulkAsync(
        int templateId,
        IFormFile recipientFile,
        IFormFile? headerImage,
        CancellationToken cancellationToken = default)
    {
        if (recipientFile == null || recipientFile.Length == 0)
        {
            throw new ArgumentException("Recipient file is empty.");
        }

        using var form = new MultipartFormDataContent();

        await using (var inputStream = recipientFile.OpenReadStream())
        using (var memoryStream = new MemoryStream())
        {
            await inputStream.CopyToAsync(
                memoryStream,
                cancellationToken);

            var fileContent = new ByteArrayContent(
                memoryStream.ToArray());

            fileContent.Headers.ContentType =
                new System.Net.Http.Headers.MediaTypeHeaderValue(
                    "application/octet-stream");

            form.Add(fileContent, "File", recipientFile.FileName);
        }


        if (headerImage is { Length: > 0 })
        {
            var extension =
                Path.GetExtension(headerImage.FileName).ToLowerInvariant();

            var contentType = extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => throw new ArgumentException(
                    "Only JPG and PNG images are supported.")
            };

            await using var imageStream = headerImage.OpenReadStream();
            using var imageMemoryStream = new MemoryStream();

            await imageStream.CopyToAsync(
                imageMemoryStream,
                cancellationToken);

            var imageContent = new ByteArrayContent(
                imageMemoryStream.ToArray());

            imageContent.Headers.ContentType =
                new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

            form.Add(
                imageContent,
                "HeaderImage",
                headerImage.FileName);
        }


        var requestUrl =
            $"api/WhatsApp/send-bulk?WhatsAppTemplateId={templateId}";

        using var response = await _httpClient.PostAsync(
            requestUrl,
            form,
            cancellationToken);

        var responseBody = await response.Content.ReadAsStringAsync(
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"API Error: {(int)response.StatusCode} - {responseBody}");
        }

        return string.IsNullOrWhiteSpace(responseBody)
            ? "Bulk message request completed successfully."
            : responseBody;
    }


    private static List<WhatsAppMessage> ParseMessages(
        JsonElement array)
    {
        var messages = new List<WhatsAppMessage>();

        if (array.ValueKind != JsonValueKind.Array)
            return messages;

        foreach (var item in array.EnumerateArray())
        {
            if (item.ValueKind == JsonValueKind.Object)
                messages.Add(ParseMessage(item));
        }

        return messages;
    }

    private static WhatsAppMessage ParseMessage(JsonElement item)
    {
        return new WhatsAppMessage
        {
            Id = GetInt(item, "id"),
            PhoneNumber = GetString(item, "phoneNumber") ?? "",
            CandidateName = GetString(item, "candidateName"),
            WhatsAppTemplateId =
                GetNullableInt(item, "whatsAppTemplateId")
                ?? GetNullableInt(item, "WhatsAppTemplateId"),
            Status = GetString(item, "status"),
            MetaMessageId = GetString(item, "metaMessageId"),
            ErrorMessage = GetString(item, "errorMessage"),
            CreatedAt = GetDate(item, "createdAt"),
            SentAt = GetDate(item, "sentAt"),
            DeliveredAt = GetDate(item, "deliveredAt"),
            ReadAt = GetDate(item, "readAt"),
            FailedAt = GetDate(item, "failedAt"),
            UpdatedAt = GetDate(item, "updatedAt"),
            ReplyMessage = GetString(item, "replyMessage"),
            ReplyReceivedAt = GetDate(item, "replyReceivedAt")
        };
    }

    private static JsonElement GetArray(JsonElement root)
    {
        if (root.ValueKind == JsonValueKind.Array)
            return root;

        if (root.ValueKind == JsonValueKind.Object)
        {
            foreach (var key in new[]
            {
                "data", "items", "result", "messages", "templates"
            })
            {
                if (TryGet(root, key, out var value) &&
                    value.ValueKind == JsonValueKind.Array)
                {
                    return value;
                }
            }
        }

        throw new JsonException(
            "Expected a JSON array or an object containing an array.");
    }

    private static bool TryGet(
        JsonElement element,
        string name,
        out JsonElement value)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                if (string.Equals(
                    property.Name,
                    name,
                    StringComparison.OrdinalIgnoreCase))
                {
                    value = property.Value;
                    return true;
                }
            }
        }

        value = default;
        return false;
    }

    private static string? GetString(
        JsonElement element, string name)
    {
        if (!TryGet(element, name, out var value) ||
            value.ValueKind == JsonValueKind.Null)
            return null;

        return value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : value.ToString();
    }

    private static int GetInt(JsonElement element, string name)
    {
        return GetNullableInt(element, name) ?? 0;
    }

    private static int? GetNullableInt(
        JsonElement element, string name)
    {
        return TryGet(element, name, out var value) &&
               int.TryParse(value.ToString(), out var number)
            ? number
            : null;
    }

    private static bool GetBool(
        JsonElement element, string name, bool defaultValue)
    {
        return TryGet(element, name, out var value) &&
               bool.TryParse(value.ToString(), out var result)
            ? result
            : defaultValue;
    }

    private static DateTime? GetDate(
        JsonElement element, string name)
    {
        return TryGet(element, name, out var value) &&
               DateTime.TryParse(value.ToString(), out var date)
            ? date
            : null;
    }
}
