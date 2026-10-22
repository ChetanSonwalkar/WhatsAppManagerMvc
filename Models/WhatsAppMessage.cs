namespace WhatsAppManagerMvc.Models
{
    public class WhatsAppMessage
    {
        public int Id { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public string? CandidateName { get; set; }
        public int? WhatsAppTemplateId { get; set; }
        public string? Status { get; set; }
        public string? MetaMessageId { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime? FailedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? ReplyMessage { get; set; }
        public DateTime? ReplyReceivedAt { get; set; }



        public int RetryCount { get; set; }


        public string? Direction { get; set; }
        public string? MessageType { get; set; }
        public string? MessageText { get; set; }
        public string? MediaUrl { get; set; }
        public string? MediaId { get; set; }
        public string? FileName { get; set; }

    }
}
