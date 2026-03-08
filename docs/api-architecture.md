# NestJS — Domain-Driven Design (DDD) Modular Architecture

> **Purpose:** Reference guide for migrating to a DDD-inspired modular architecture in NestJS. Hand this to your agent as the architectural contract to follow.

---

## 1. Guiding Principles

| Principle | Rule |
|---|---|
| **Thin Controllers** | Controllers only parse requests, call services, and return responses. Zero business logic. |
| **Fat Services** | All domain logic lives in `*.service.ts`. Services are transport-agnostic. |
| **Module Isolation** | Every module owns its own DTOs, entities, interfaces, and repository. No cross-module entity imports. |
| **Dependency Direction** | Modules depend on `core/` and `common/`. They never depend on each other directly — use events or shared interfaces instead. |
| **Swappable Infrastructure** | DB adapters, email, payments live in `providers/`. Business logic never calls external SDKs directly. |

---

## 2. Full Directory Structure

```
src/
├── common/                          # Stateless, reusable utilities
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── guards/
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   ├── pipes/
│   │   └── parse-pagination.pipe.ts
│   └── index.ts                     # Barrel export
│
├── config/                          # Environment & service configs
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── config.module.ts
│
├── core/                            # Singleton infrastructure modules
│   ├── database/
│   │   └── database.module.ts
│   ├── logger/
│   │   └── logger.module.ts
│   └── health/
│       └── health.module.ts
│
├── modules/                         # Domain feature modules
│   ├── auth/
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── users/
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── interfaces/
│   │   │   └── user.interface.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── users.module.ts
│   │
│   └── orders/
│       ├── dto/
│       ├── entities/
│       ├── interfaces/
│       ├── orders.controller.ts
│       ├── orders.service.ts
│       ├── orders.repository.ts
│       └── orders.module.ts
│
├── providers/                       # External service wrappers
│   ├── mail/
│   │   ├── mail.service.ts          # Wraps Mailgun/SendGrid
│   │   └── mail.module.ts
│   ├── payment/
│   │   ├── payment.service.ts       # Wraps Stripe/LemonSqueezy
│   │   └── payment.module.ts
│   └── storage/
│       ├── storage.service.ts       # Wraps AWS S3/Cloudflare R2
│       └── storage.module.ts
│
├── app.module.ts
└── main.ts
```

---

## 3. Layer Responsibilities

### `common/` — Stateless Utilities
- **What belongs here:** Custom decorators, global exception filters, guards, interceptors, pipes
- **What does NOT belong here:** Anything with `@Injectable()` that holds state, any DB logic
- **Pattern:** Always export via `index.ts` barrel file

```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

---

### `config/` — Configuration
- **What belongs here:** `@nestjs/config` schema validation, typed config factories
- **Rule:** Never `process.env.X` outside this folder. Use injected `ConfigService` everywhere else.

```typescript
// config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  name: process.env.DB_NAME,
}));
```

---

### `core/` — Singleton Infrastructure
- **What belongs here:** DatabaseModule, LoggerModule, HealthModule — things imported once in `AppModule` and never again
- **Rule:** These modules are `@Global()`. Avoid over-using global scope — only true singletons belong here.

```typescript
// core/database/database.module.ts
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('database'),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
```

---

### `modules/` — Domain Feature Modules

Each module is **fully self-contained**. The internal structure:

| File | Responsibility |
|---|---|
| `*.controller.ts` | HTTP routing, request parsing, response shaping |
| `*.service.ts` | All business logic, orchestration |
| `*.repository.ts` | All DB queries. Abstracts ORM from the service layer |
| `entities/*.entity.ts` | ORM schema/model definition |
| `dto/*.dto.ts` | Input validation via `class-validator` |
| `interfaces/*.interface.ts` | TypeScript types/contracts for the domain |
| `*.module.ts` | Wires the above together, declares exports |

**Controller (thin):**
```typescript
// modules/users/users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id); // No logic here
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

**Repository pattern:**
```typescript
// modules/users/users.repository.ts
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  save(user: Partial<User>): Promise<User> {
    return this.repo.save(user);
  }
}
```

**Service (business logic only):**
```typescript
// modules/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
}
```

---

### `providers/` — External Service Wrappers
- **What belongs here:** Any SDK that talks to a third-party (Stripe, SendGrid, S3)
- **Rule:** Business logic never imports `stripe` or `@aws-sdk` directly. It imports `PaymentService` or `StorageService`
- **Benefit:** Switching Stripe → LemonSqueezy means editing ONE file

```typescript
// providers/mail/mail.service.ts
@Injectable()
export class MailService {
  async sendWelcome(to: string, name: string): Promise<void> {
    // Mailgun/SendGrid SDK call contained here
  }
}
```

---

## 4. Module Wiring Example

```typescript
// modules/users/users.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MailModule,                        // From providers/
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],             // Only export what other modules need
})
export class UsersModule {}
```

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,        // core/
    LoggerModule,          // core/
    UsersModule,           // modules/
    AuthModule,            // modules/
    OrdersModule,          // modules/
  ],
})
export class AppModule {}
```

---

## 5. Cross-Module Communication Rules

**Do NOT do this:**
```typescript
// ❌ orders.service.ts importing UsersRepository directly
import { UsersRepository } from '../users/users.repository';
```

**Do this instead — import the exported Service:**
```typescript
// ✅ orders.service.ts
import { UsersService } from '../users/users.service';

// And in OrdersModule:
imports: [UsersModule]  // UsersModule must export UsersService
```

**For decoupled async flows — use Events:**
```typescript
// Emit from one module, handle in another
this.eventEmitter.emit('order.created', new OrderCreatedEvent(order));
```

---

## 6. DTO Conventions (`class-validator`)

```typescript
// modules/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}
```

---

## 7. Barrel Files (`index.ts`)

Every folder should have an `index.ts` to keep imports clean:

```typescript
// common/index.ts
export * from './decorators/current-user.decorator';
export * from './filters/http-exception.filter';
export * from './guards/roles.guard';
```

Usage:
```typescript
// ✅ Clean
import { CurrentUser, RolesGuard } from '@common';

// ❌ Verbose
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
```

Configure path aliases in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@common": ["src/common/index.ts"],
      "@config": ["src/config/index.ts"],
      "@modules/*": ["src/modules/*/index.ts"]
    }
  }
}
```

---

## 8. Migration Checklist

Use this when porting each feature from your existing codebase:

- [ ] Create `modules/<feature>/` folder
- [ ] Move/create `entities/` — ORM models only, no business logic
- [ ] Move/create `dto/` — add `class-validator` decorators
- [ ] Create `interfaces/` — extract TypeScript types
- [ ] Create `*.repository.ts` — move all direct DB calls here
- [ ] Move business logic to `*.service.ts` — strip any `req`/`res` references
- [ ] Thin out `*.controller.ts` — should only call service methods
- [ ] Wire in `*.module.ts` — declare providers, imports, exports
- [ ] Move external SDK calls to `providers/`
- [ ] Replace `process.env` usages with `ConfigService`
- [ ] Add barrel `index.ts` exports
- [ ] Register module in `app.module.ts`

---

## 9. Scalability Reference

| Pattern | Why It Scales |
|---|---|
| Module-per-feature | Teams work on separate modules without merge conflicts |
| Repository layer | Swap databases (Postgres → Mongo) without touching services |
| Provider wrappers | Replace any third-party (Stripe → LemonSqueezy) in one file |
| Thin controllers | Controllers become pure adapters — reusable across HTTP, gRPC, WebSockets |
| Event emitter | Decouple modules — prerequisite for extracting microservices later |
| Config factories | Environment changes never touch business logic |