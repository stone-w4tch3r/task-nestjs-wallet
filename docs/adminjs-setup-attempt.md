# AdminJS Setup Attempt Report

## Overview

This document details the attempt to integrate AdminJS (Django-like auto-generated admin panel) into the Wallet Service NestJS application.

## Date

February 5, 2026

## Objective

Add a web-based admin panel similar to Django Admin that automatically generates CRUD interfaces from TypeORM entities for the following entities:

- Wallet
- Transaction
- DailyLimit
- IdempotencyLog

## Attempted Solutions

### 1. AdminJS v7 with @adminjs/nestjs

#### Initial Setup

```bash
npm install adminjs@7.8.17 @adminjs/nestjs@7.0.0 @adminjs/typeorm@5.0.1
```

#### Configuration Approach

Created `src/admin/admin.ts` with AdminJS configuration:

- Registered TypeORM adapter
- Configured all 4 entities as resources
- Set up property types (number, date, mixed)
- Added available values for enum fields (TOPUP, CHARGE)

Modified `src/main.ts` to:

- Import AdminJSExpress
- Build router and mount at `/admin`
- Use NestJS HTTP adapter

Modified `src/app.module.ts` to:

- Import AdminModule from @adminjs/nestjs
- Configure with entity resources
- Set rootPath to `/admin`

#### Issues Encountered

**TypeScript Compilation Errors:**

```
Cannot find module '@adminjs/nestjs' or its corresponding type declarations.
Cannot find module '@adminjs/typeorm' or its corresponding type declarations.
```

**Root Cause:**

- AdminJS v7 packages are ES modules (type: "module" in package.json)
- NestJS application uses CommonJS (type: "commonjs" in tsconfig.json)
- TypeScript couldn't resolve module exports due to mismatched module systems

**Attempted Fixes:**

1. **Changed tsconfig moduleResolution to "bundler"**
   - Error: `Option 'bundler' can only be used when 'module' is set to 'preserve' or 'es2015' or later`

2. **Changed module to "ES2020"**
   - Error: `Option 'module' must be set to 'Node16' when option 'moduleResolution' is set to 'Node16'`

3. **Changed moduleResolution to "node16"**
   - Error: `Option 'module' must be set to 'Node16' when option 'moduleResolution' is set to 'Node16'`

4. **Changed moduleResolution to "nodenext"**
   - Error: `Option 'module' must be set to 'preserve' or 'es2015' or later when option 'moduleResolution' is set to 'nodenext'`

5. **Added skipLibCheck to tsconfig**
   - Resolved node_modules type errors
   - Still had runtime module resolution errors

**Runtime Error:**

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in node_modules/@adminjs/nestjs/package.json
```

### 2. AdminJS v6 with Compatible Adapters

#### Setup

```bash
npm install adminjs@6.8.7 @adminjs/express@5.1.0 @adminjs/typeorm@4.0.0 express-session
```

#### Issues Encountered

**TypeScript Errors:**

- `Cannot find module 'adminjs' or its corresponding type declarations`
- `Cannot find module '@adminjs/express' or its corresponding type declarations`

**Deprecation Warnings:**

```
npm warn deprecated @adminjs/express@5.1.0: Only latest major versions of AdminJS packages are supported, upgrade to @latest
npm warn deprecated @adminjs/typeorm@4.0.0: Only latest major versions of AdminJS packages are supported, upgrade to @latest
npm warn deprecated @adminjs/design-system@3.1.8: Only latest major versions of AdminJS packages are supported, upgrade to @latest
```

**Additional Error:**

```
error TS1010: '*/' expected.
node_modules/csstype/index.d.ts:17910:8
    * Si
```

## Root Cause Analysis

The fundamental issue is a **module system incompatibility**:

1. **AdminJS v7 Architecture:**
   - Built as ES modules (type: "module")
   - Uses modern JavaScript import/export syntax
   - Requires Node.js to run in ES module mode

2. **NestJS Application Setup:**
   - Configured for CommonJS (module: "commonjs")
   - Traditional require/module.exports system
   - TypeScript compiler targeting CommonJS

3. **TypeORM Configuration:**
   - Uses TypeORM with NestJS integration
   - Entities use decorators (@Entity, @Column, etc.)
   - All existing code follows CommonJS patterns

## Possible Solutions for Future Implementation

### Option 1: Convert Project to ES Modules

**Changes Required:**

1. Update `package.json`:

   ```json
   {
     "type": "module"
   }
   ```

2. Update `tsconfig.json`:

   ```json
   {
     "compilerOptions": {
       "module": "ESNext",
       "moduleResolution": "bundler",
       "target": "ES2023"
     }
   }
   ```

3. Refactor all imports:
   - Remove `.js` extensions from local imports (TypeScript will handle)
   - Update dynamic imports
   - Update any CommonJS-specific code

4. Update build configuration:
   - Modify NestJS build process for ES module output
   - Update Dockerfile if needed

**Pros:**

- Modern JavaScript/TypeScript approach
- Better compatibility with AdminJS v7
- Future-proof

**Cons:**

- Requires extensive refactoring
- May break existing dependencies
- Potential runtime issues with CommonJS packages
- Time-intensive (several hours)

### Option 2: Use Older AdminJS with Workarounds

**Approach:**

- Use AdminJS v6 with extensive type declarations
- Create custom type definitions for problematic packages
- Disable strict type checking for AdminJS-related files

**Pros:**

- Minimal code changes
- Works with CommonJS

**Cons:**

- Deprecated packages (not recommended)
- May have security vulnerabilities
- Linting errors
- No long-term support

### Option 3: Alternative Admin Panel Libraries

**nestjs-admin:**

```bash
npm install nestjs-admin
```

- Explicitly Django-inspired
- Less mature than AdminJS
- May have different compatibility issues

**Custom Implementation:**

- Build simple CRUD interface with existing NestJS controllers
- Use existing entities
- No external dependencies

**Pros:**

- Full control
- No compatibility issues
- Can extend as needed

**Cons:**

- Development time required
- No auto-generation features
- Manual maintenance

### Option 4: Use PostgreSQL GUI Tools (Recommended)

**No Code Changes Required:**

Use external database management tools:

- **pgAdmin** - Official PostgreSQL GUI
- **DBeaver** - Universal database tool
- **Beekeeper Studio** - Modern open-source
- **TablePlus** - Native, fast

**Connection Details:**

- Host: `localhost` (or `postgres` in Docker)
- Port: `5432`
- Database: `wallet`
- Username: `wallet`
- Password: `wallet123`

**Pros:**

- Immediate use
- No code changes
- Professional features
- Well-tested tools

**Cons:**

- Separate application
- No auto-generation from TypeORM
- Manual setup

## Files Modified During Attempt

### Created:

- `src/admin/admin.ts` - AdminJS configuration
- `src/types/adminjs.d.ts` - Type declarations (attempted)

### Modified:

- `src/app.module.ts` - Added AdminModule imports
- `src/main.ts` - Added AdminJS router mounting
- `tsconfig.json` - Changed moduleResolution, added skipLibCheck
- `package.json` - Added/removed various AdminJS packages

### Deleted After Cleanup:

- All AdminJS-related files and configurations

## Recommendations

### Immediate Solution (Current)

Use **pgAdmin** or **DBeaver** for database management:

- Download and install the GUI application
- Connect to running PostgreSQL database
- Use for debugging, data inspection, and manual edits
- No code changes required

### Future Integration

If you want an integrated admin panel:

**Best Approach:** Convert project to ES modules gradually:

1. Set up test branch
2. Follow migration guide: https://nodejs.org/api/esm.html
3. Update TypeScript configuration
4. Refactor imports incrementally
5. Test thoroughly
6. Then install AdminJS v7

**Alternative:** Build custom simple admin interface:

- Use existing NestJS structure
- Create admin controller with CRUD endpoints
- Add simple React/Vue frontend
- Leverage existing TypeORM entities
- Full control, no compatibility issues

## Conclusion

AdminJS v7 cannot be integrated into the current NestJS application without significant refactoring due to module system incompatibility. The project is configured for CommonJS, while AdminJS v7 requires ES modules.

For immediate database management needs, external PostgreSQL GUI tools are recommended. For future integration of an auto-generated admin panel, converting the project to ES modules would be required.

## References

- AdminJS Documentation: https://adminjs.co/
- Node.js ES Modules: https://nodejs.org/api/esm.html
- TypeScript Module Resolution: https://www.typescriptlang.org/tsconfig#moduleResolution
- AdminJS GitHub: https://github.com/SoftwareBrothers/adminjs
