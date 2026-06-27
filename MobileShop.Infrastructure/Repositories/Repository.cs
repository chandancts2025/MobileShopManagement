using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Interfaces.Repositories;
using MobileShop.Domain.Common;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Repositories;

public class Repository<T>(MobileShopDbContext dbContext) : IRepository<T> where T : BaseEntity
{
    private readonly DbSet<T> _dbSet = dbContext.Set<T>();

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _dbSet.FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken);

    public async Task<IReadOnlyCollection<T>> ListAsync(CancellationToken cancellationToken = default) =>
        await _dbSet.ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default) =>
        await _dbSet.Where(predicate).ToListAsync(cancellationToken);

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default) =>
        await _dbSet.AddAsync(entity, cancellationToken);

    public void Update(T entity) => _dbSet.Update(entity);

    public void Remove(T entity) => _dbSet.Remove(entity);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
