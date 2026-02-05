# AdminJS Integration Bug

## Summary

AdminJS is not registering its routes properly in the NestJS application. The module loads successfully, but no `/db-admin` routes are mapped to the application.

## Current Status

- ✅ AdminJS packages installed
- ✅ Entities extend `BaseEntity` from TypeORM
- ✅ Module configuration is correct
- ✅ Build passes lint and typecheck
- ✅ Application starts without errors
- ❌ AdminJS routes (`/db-admin/*`) are NOT registered
- ✅ Regular app routes work (Wallet API, frontend)

## Observed Behavior

### Server Logs

```
[Nest] InstanceLoader [AdminModule dependencies initialized
[Nest] RoutesResolver [AppController {/}:
[Nest] RouterExplorer Mapped {/hello, GET} route
[Nest] RoutesResolver [WalletController {/wallet}:
[Nest] RouterExplorer Mapped {/wallet/create, POST} route
[Nest] RouterExplorer Mapped {/wallet/topup, POST} route
[Nest] RouterExplorer Mapped {/wallet/charge, POST} route
[Nest] RouterExplorer Mapped {/wallet/balance, GET} route
[Nest] RoutesResolver [AdminController {/admin/db}:
[Nest] RouterExplorer Mapped {/admin/db/reset, POST} route
[Nest] NestApplication successfully started
```

**Notice:** No AdminJS routes are mapped. Expected routes:

- `/db-admin` or `/admin`
- `/db-admin/login`
- `/db-admin/resources`
- etc.

### HTTP Response

```bash
curl http://localhost:3000/db-admin
# Returns the frontend index.html (Wallet API Tester)
# Should return AdminJS UI or redirect to login
```

## What Was Tried

### Attempt 1: Basic Integration

- Created `adminjs.config.ts` with resource configuration
- Registered TypeORM adapter: `AdminJS.registerAdapter({ Database, Resource })`
- Used `AdminModule.createAdminAsync()` with factory pattern

**Result:** ❌ `NoResourceAdapterError: There are no adapters supporting one of the resource you provided`

### Attempt 2: Extend BaseEntity

- Modified all entities to extend `BaseEntity` from TypeORM
- Entities now have `.getRepository()` static method required by @adminjs/typeorm

**Result:** ❌ Same adapter error

### Attempt 3: DataSource Injection in Factory

```typescript
useFactory: (dataSource: DataSource) => {
  Wallet.useDataSource(dataSource);
  Transaction.useDataSource(dataSource);
  DailyLimit.useDataSource(dataSource);
  IdempotencyLog.useDataSource(dataSource);
  return { adminJsOptions: createAdminJS(), ... };
}
```

**Result:** ❌ `NoResourceAdapterError` - Resources still not recognized by adapter

### Attempt 4: OnModuleInit Hook

```typescript
export class AdminModule implements OnModuleInit {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    Wallet.useDataSource(this.dataSource);
    Transaction.useDataSource(this.dataSource);
    DailyLimit.useDataSource(this.dataSource);
    IdempotencyLog.useDataSource(this.dataSource);
  }
}
```

**Result:** ❌ Module still tries to use resources before hook runs

### Attempt 5: Minimal Configuration (Current)

```typescript
export const createAdminJS = (): AdminJS => {
  return new AdminJS({
    rootPath: '/db-admin',
    resources: [], // Start with no resources
  });
};
```

**Result:** ❌ AdminJS module loads, routes still not registered

### Attempt 6: Direct Import in AppModule

```typescript
import { AdminModule as AdminJsNestModule } from '@adminjs/nestjs';
import { createAdminJS } from './admin/adminjs.config.js';

@Module({
  imports: [
    // ...
    AdminJsNestModule.createAdminAsync({
      imports: [WalletModule],
      useFactory: () => ({ adminJsOptions: createAdminJS(), ... }),
      inject: [],
    }),
  ],
  // ...
})
```

**Result:** ❌ Module loads, but no routes registered

## Root Cause Analysis

### Possible Issue 1: Version Compatibility

Current package versions:

```json
{
  "adminjs": "^7.8.17",
  "@adminjs/nestjs": "^7.0.0",
  "@adminjs/typeorm": "^5.0.1",
  "@nestjs/common": "^11.0.1",
  "typeorm": "^0.3.28"
}
```

AdminJS v7.8.x may have breaking changes not reflected in docs.

### Possible Issue 2: Module Loading Order

AdminModule's `onModuleInit()` runs AFTER AdminJS module's `onModuleInit()`. This means:

- AdminJS tries to load resources
- Resources don't have DataSource attached yet
- Adapter's `isAdapterFor()` returns false
- Resources are ignored

### Possible Issue 3: Adapter Registration Timing

The @adminjs/typeorm adapter checks if a resource is valid using:

```typescript
static isAdapterFor(rawResource) {
  try {
    return !!rawResource.getRepository().metadata;
  } catch (e) {
    return false;
  }
}
```

If `.getRepository()` is called before DataSource is attached, it throws.

## Package Files Investigation

### @adminjs/nestjs Structure

```
node_modules/@adminjs/nestjs/
├── build/
│   ├── admin.module.js
│   └── loaders/
├── package.json
└── types/
```

The module uses dynamic imports:

```javascript
const { default: AdminJS } = await import('adminjs');
```

This may cause timing issues with TypeScript compilation.

## Next Steps to Fix

1. **Try synchronous module initialization:**
   - Use `createAdmin()` instead of `createAdminAsync()`
   - Ensure DataSource is attached before AdminJS instantiation

2. **Try alternative adapter approach:**
   - Manually create AdminJS instance in main.ts
   - Use express-session middleware directly
   - Avoid @adminjs/nestjs wrapper

3. **Downgrade AdminJS packages:**
   - Try AdminJS v6.x with @adminjs/nestjs v4.x
   - Check compatibility matrix in README

4. **Create custom loader:**
   - Use `ExpressLoader` from @adminjs/nestjs directly
   - Pass custom loader via `customLoader` option

5. **Review example projects:**
   - https://github.com/SoftwareBrothers/adminjs-nestjs/tree/master/example-app
   - Check for TypeScript/ESM setup differences

## Workaround (Current)

The frontend has a "🗄️ DB Admin" button that opens `/db-admin`. When working, this will:

- Link to AdminJS dashboard
- Allow browsing/managing all database entities
- Provide CRUD interface for Wallet, Transaction, DailyLimit, IdempotencyLog tables

For now, the button will show a 404 or redirect to frontend until AdminJS integration is fixed.

## Environment

- Node.js: v22.20.0
- TypeScript: v5.7.3
- NestJS: v11.0.1
- TypeORM: v0.3.28
- OS: Linux
- Build: ESM modules (type: "module" in package.json)

## Files Involved

- `src/admin/adminjs.config.ts` - AdminJS configuration
- `src/admin/admin.module.ts` - NestJS module wrapper
- `src/entities/*.ts` - All TypeORM entities (now extend BaseEntity)
- `src/app.module.ts` - Root module configuration
- `src/frontend/index.html` - Frontend with DB Admin link
- `package.json` - Dependencies and scripts

## References

- AdminJS Docs: https://adminjs.co/docs.html
- @adminjs/nestjs: https://github.com/SoftwareBrothers/adminjs-nestjs
- @adminjs/typeorm: https://github.com/SoftwareBrothers/adminjs-typeorm
