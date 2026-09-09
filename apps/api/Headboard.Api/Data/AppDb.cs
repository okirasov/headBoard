using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Data;

public class AppDb(DbContextOptions<AppDb> options) : DbContext(options)
{
    public DbSet<UserRow> Users => Set<UserRow>();
    public DbSet<ProjectRow> Projects => Set<ProjectRow>();
    public DbSet<TaskRow> Tasks => Set<TaskRow>();
    public DbSet<CommentRow> Comments => Set<CommentRow>();
    public DbSet<FileRow> Files => Set<FileRow>();
    public DbSet<SettingsRow> Settings => Set<SettingsRow>();
    public DbSet<CalendarLinkRow> CalendarLinks => Set<CalendarLinkRow>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<CalendarLinkRow>(e => e.HasKey(x => x.UserId));
        b.Entity<UserRow>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.Provider, x.Subject }).IsUnique();
        });

        b.Entity<ProjectRow>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
        });

        b.Entity<TaskRow>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => new { x.UserId, x.Status });
        });

        b.Entity<CommentRow>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.TaskId);
        });

        b.Entity<FileRow>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.TaskId);
            e.HasIndex(x => x.ProjectId);
        });

        b.Entity<SettingsRow>(e =>
        {
            e.HasKey(x => x.UserId);
        });
    }
}
