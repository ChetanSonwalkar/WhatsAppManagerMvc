namespace WhatsAppManagerMvc.Models
{

    public class WhatsAppTemplate
    {
        public int Id { get; set; }
        public string TemplateName { get; set; } = string.Empty;
        public string? LanguageCode { get; set; }
        public string? Category { get; set; }
        public bool IsActive { get; set; } = true;

        public string? HeaderFormat { get; set; }
        public string? HeaderImageUrl { get; set; }

        public string? BodyText { get; set; }
    }
}
