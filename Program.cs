
using WhatsAppManagerMvc.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

builder.Services.AddHttpClient<WhatsAppApiService>((serviceProvider, client) =>
{
    var configuration =
        serviceProvider.GetRequiredService<IConfiguration>();

    var baseUrl =
        configuration["WhatsAppApi:BaseUrl"]
        ?? "https://whatsapp.ciitstudent.com/";

    client.BaseAddress = new Uri(
        baseUrl.EndsWith('/') ? baseUrl : baseUrl + "/");

    client.Timeout = TimeSpan.FromMinutes(3);
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Dashboard}/{action=Index}/{id?}");

app.Run();
