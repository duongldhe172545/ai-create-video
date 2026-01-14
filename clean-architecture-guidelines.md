# Quy Tắc Clean Architecture cho Next.js

## 📋 Tổng Quan

Clean Architecture là một tập hợp các quy tắc giúp cấu trúc ứng dụng dễ bảo trì, dễ test và có codebase dự đoán được. Nguyên tắc cốt lõi là **tách biệt các mối quan tâm (separation of concerns)** thông qua các lớp (layers).

## 🎯 Nguyên Tắc Cơ Bản

### Quy Tắc Phụ Thuộc (Dependency Rule)

> **Các lớp chỉ phụ thuộc vào các lớp bên dưới chúng, KHÔNG phụ thuộc vào các lớp bên trên.**

```
Frameworks & Drivers (app/)
        ↓
Interface Adapters (src/interface-adapters/)
        ↓
Application Layer (src/application/)
        ↓
Entities Layer (src/entities/)
```

### Độc Lập Quan Trọng

- **Độc lập với UI**: Logic nghiệp vụ không phụ thuộc vào Next.js hay framework UI nào
- **Độc lập với Database**: Implementation database được tách riêng, giao tiếp qua Models
- **Độc lập với Frameworks**: Business rules sử dụng plain JavaScript
- **Dễ Test**: Business logic có thể test mà không cần UI, database hay web server

---

## 📂 Cấu Trúc Thư Mục Chuẩn

```
project-root/
├── app/                        # Frameworks & Drivers Layer (Next.js)
│   ├── (pages)/               # Pages, layouts
│   ├── components/            # UI Components (Server & Client)
│   ├── actions/               # Server Actions
│   └── api/                   # API Route Handlers
│
├── src/                       # Core System
│   ├── entities/              # Entities Layer
│   │   ├── models/           # Domain models (plain JS/TS)
│   │   └── errors/           # Custom error classes
│   │
│   ├── application/           # Application Layer
│   │   ├── use-cases/        # Business logic operations
│   │   ├── repositories/     # Repository interfaces
│   │   └── services/         # Service interfaces
│   │
│   ├── infrastructure/        # Infrastructure Layer
│   │   ├── repositories/     # Repository implementations
│   │   └── services/         # Service implementations
│   │
│   └── interface-adapters/   # Interface Adapters Layer
│       ├── controllers/      # Controllers
│       └── presenters/       # Data presenters
│
├── di/                        # Dependency Injection setup
│   ├── container.ts          # IoC container configuration
│   └── modules.ts            # DI modules
│
├── drizzle/                   # Database (nếu dùng Drizzle ORM)
│   ├── schema.ts             # Database schema
│   └── migrations/           # DB migrations
│
├── tests/                     # Unit tests
│   └── unit/                 # Mirror src/ structure
│
├── .eslintrc.json            # ESLint config (với boundaries plugin)
└── vitest.config.ts          # Test config
```

---

## 🔷 Chi Tiết Từng Lớp

### 1️⃣ Entities Layer (`src/entities/`)

**Mục đích**: Định nghĩa Models và Custom Errors

#### 📌 Models (Domain Models)

**Quy tắc:**
- ✅ Sử dụng **plain JavaScript/TypeScript** (không dùng database-specific types)
- ✅ Định nghĩa validation rules ("Enterprise Business Rules")
- ✅ Không phải lúc nào cũng map 1-1 với database tables
- ✅ Sử dụng Zod, Yup, hoặc class-based validation

**Ví dụ:**
```typescript
// src/entities/models/user.ts
import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(6).regex(/^[a-zA-Z0-9_]+$/), // Enterprise Business Rule
  email: z.string().email(),
  createdAt: z.date(),
});

export type User = z.infer<typeof userSchema>;
```

#### 📌 Custom Errors

**Quy tắc:**
- ✅ Tạo custom error classes cho từng domain error
- ✅ **KHÔNG** bubble up database-specific errors
- ✅ Catch errors từ external libraries và convert sang custom errors

**Ví dụ:**
```typescript
// src/entities/errors/user-errors.ts
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid username or password');
    this.name = 'InvalidCredentialsError';
  }
}
```

---

### 2️⃣ Application Layer (`src/application/`)

**Mục đích**: Chứa business logic, use cases và interfaces

#### 📌 Use Cases

**Quy tắc:**
- ✅ Mỗi use case = 1 operation cụ thể (VD: "Create Todo", "Sign In", "Toggle Todo")
- ✅ Nhận pre-validated input từ controllers
- ✅ Thực hiện authorization checks
- ✅ Sử dụng Repositories và Services (qua interfaces)
- ❌ **KHÔNG** gọi use case khác từ use case (code smell!)

**Ví dụ:**
```typescript
// src/application/use-cases/create-todo.use-case.ts
import type { TodoRepository } from '../repositories/todo.repository';
import type { Todo } from '../../entities/models/todo';
import { UnauthorizedError } from '../../entities/errors/auth-errors';

export class CreateTodoUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(userId: string, title: string): Promise<Todo> {
    // Authorization check
    if (!userId) {
      throw new UnauthorizedError();
    }

    // Business logic
    const todo = await this.todoRepository.create({
      userId,
      title,
      completed: false,
      createdAt: new Date(),
    });

    return todo;
  }
}
```

#### 📌 Repository Interfaces

**Quy tắc:**
- ✅ Định nghĩa interfaces trong `application/`, implement trong `infrastructure/`
- ✅ Mỗi method = 1 database operation
- ✅ Sử dụng domain models (không dùng database types)

**Ví dụ:**
```typescript
// src/application/repositories/todo.repository.ts
import type { Todo } from '../../entities/models/todo';

export interface TodoRepository {
  create(data: Omit<Todo, 'id'>): Promise<Todo>;
  findById(id: string): Promise<Todo | null>;
  findByUserId(userId: string): Promise<Todo[]>;
  update(id: string, data: Partial<Todo>): Promise<Todo>;
  delete(id: string): Promise<void>;
}
```

#### 📌 Service Interfaces

**Quy tắc:**
- ✅ Định nghĩa interfaces cho external services (email, authentication, payment, etc.)
- ✅ Implementation trong `infrastructure/`

**Ví dụ:**
```typescript
// src/application/services/email.service.ts
export interface EmailService {
  sendWelcomeEmail(email: string, name: string): Promise<void>;
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
}
```

---

### 3️⃣ Infrastructure Layer (`src/infrastructure/`)

**Mục đích**: Implement repositories và services với external dependencies

#### 📌 Repository Implementations

**Quy tắc:**
- ✅ Implement interfaces từ `application/repositories/`
- ✅ Sử dụng database library/driver CHỈ ở đây
- ✅ **KHÔNG** validate data (validation ở controllers/use cases)
- ✅ Catch database errors và convert sang custom errors

**Ví dụ:**
```typescript
// src/infrastructure/repositories/drizzle-todo.repository.ts
import { db } from '../../../drizzle/client';
import { todos } from '../../../drizzle/schema';
import type { TodoRepository } from '../../application/repositories/todo.repository';
import type { Todo } from '../../entities/models/todo';
import { TodoNotFoundError } from '../../entities/errors/todo-errors';

export class DrizzleTodoRepository implements TodoRepository {
  async create(data: Omit<Todo, 'id'>): Promise<Todo> {
    try {
      const [todo] = await db.insert(todos).values(data).returning();
      return todo;
    } catch (error) {
      // Convert database error to custom error
      throw new Error('Failed to create todo');
    }
  }

  async findById(id: string): Promise<Todo | null> {
    const todo = await db.query.todos.findFirst({
      where: (todos, { eq }) => eq(todos.id, id),
    });
    return todo || null;
  }

  // ... other methods
}
```

#### 📌 Service Implementations

**Ví dụ:**
```typescript
// src/infrastructure/services/resend-email.service.ts
import { Resend } from 'resend';
import type { EmailService } from '../../application/services/email.service';

export class ResendEmailService implements EmailService {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.resend.emails.send({
      from: 'noreply@example.com',
      to: email,
      subject: 'Welcome!',
      html: `<h1>Hello ${name}!</h1>`,
    });
  }

  // ... other methods
}
```

---

### 4️⃣ Interface Adapters Layer (`src/interface-adapters/`)

**Mục đích**: Controllers orchestrate use cases, Presenters format output

#### 📌 Controllers

**Quy tắc:**
- ✅ Thực hiện authentication checks
- ✅ Validate input data
- ✅ **Orchestrate** use cases (không implement logic)
- ✅ Handle errors từ deeper layers
- ✅ Sử dụng Presenters để format response

**Ví dụ:**
```typescript
// src/interface-adapters/controllers/todo.controller.ts
import type { CreateTodoUseCase } from '../../application/use-cases/create-todo.use-case';
import type { TodoPresenter } from '../presenters/todo.presenter';
import { UnauthorizedError } from '../../entities/errors/auth-errors';

export class TodoController {
  constructor(
    private createTodoUseCase: CreateTodoUseCase,
    private todoPresenter: TodoPresenter
  ) {}

  async createTodo(userId: string | null, title: string) {
    // Authentication check
    if (!userId) {
      throw new UnauthorizedError();
    }

    // Input validation
    if (!title || title.trim().length === 0) {
      throw new Error('Title is required');
    }

    // Orchestrate use case
    const todo = await this.createTodoUseCase.execute(userId, title);

    // Present data
    return this.todoPresenter.present(todo);
  }
}
```

#### 📌 Presenters

**Quy tắc:**
- ✅ Convert data sang UI-friendly format
- ✅ Remove sensitive fields (passwords, internal IDs, etc.)
- ✅ Format dates, numbers, etc.
- ✅ Giảm data size gửi về client

**Ví dụ:**
```typescript
// src/interface-adapters/presenters/todo.presenter.ts
import type { Todo } from '../../entities/models/todo';

export class TodoPresenter {
  present(todo: Todo) {
    return {
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
      createdAt: todo.createdAt.toISOString(), // Format date
      // userId is excluded (sensitive data)
    };
  }

  presentList(todos: Todo[]) {
    return todos.map(todo => this.present(todo));
  }
}
```

---

### 5️⃣ Frameworks & Drivers Layer (`app/`)

**Mục đích**: Next.js specific code - Pages, Components, Server Actions, API Routes

#### 📌 Quy Tắc

- ✅ CHỈ sử dụng Controllers, Models và Errors
- ❌ **KHÔNG** import Use Cases, Repositories, Services trực tiếp
- ✅ Handle errors từ controllers
- ✅ UI components (Server & Client Components)

**Ví dụ Server Action:**
```typescript
// app/actions/todo.actions.ts
'use server';

import { container } from '@/di/container';
import { TYPES } from '@/di/types';
import type { TodoController } from '@/src/interface-adapters/controllers/todo.controller';
import { revalidatePath } from 'next/cache';

export async function createTodoAction(userId: string, title: string) {
  try {
    const controller = container.get<TodoController>(TYPES.TodoController);
    const result = await controller.createTodo(userId, title);
    
    revalidatePath('/todos');
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: 'Unauthorized' };
    }
    return { success: false, error: 'Failed to create todo' };
  }
}
```

**Ví dụ API Route:**
```typescript
// app/api/todos/route.ts
import { container } from '@/di/container';
import { TYPES } from '@/di/types';
import type { TodoController } from '@/src/interface-adapters/controllers/todo.controller';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { title } = await request.json();
    const userId = request.headers.get('x-user-id'); // Example auth
    
    const controller = container.get<TodoController>(TYPES.TodoController);
    const result = await controller.createTodo(userId, title);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

### 6️⃣ Dependency Injection (`di/`)

**Mục đích**: Setup IoC container để inject implementations

#### 📌 Quy Tắc

- ✅ Sử dụng library như `ioctopus` (works on all runtimes)
- ✅ Bind interfaces to implementations
- ✅ Resolve dependencies using Symbols
- ✅ **KHÔNG** import implementations trực tiếp ở upper layers

**Ví dụ:**
```typescript
// di/types.ts
export const TYPES = {
  // Repositories
  TodoRepository: Symbol.for('TodoRepository'),
  
  // Services
  EmailService: Symbol.for('EmailService'),
  
  // Use Cases
  CreateTodoUseCase: Symbol.for('CreateTodoUseCase'),
  
  // Controllers
  TodoController: Symbol.for('TodoController'),
  
  // Presenters
  TodoPresenter: Symbol.for('TodoPresenter'),
};
```

```typescript
// di/container.ts
import { Container } from 'ioctopus';
import { TYPES } from './types';

// Infrastructure
import { DrizzleTodoRepository } from '@/src/infrastructure/repositories/drizzle-todo.repository';
import { ResendEmailService } from '@/src/infrastructure/services/resend-email.service';

// Use Cases
import { CreateTodoUseCase } from '@/src/application/use-cases/create-todo.use-case';

// Controllers & Presenters
import { TodoController } from '@/src/interface-adapters/controllers/todo.controller';
import { TodoPresenter } from '@/src/interface-adapters/presenters/todo.presenter';

const container = new Container();

// Bind repositories
container.bind(TYPES.TodoRepository).toClass(DrizzleTodoRepository);

// Bind services
container.bind(TYPES.EmailService).toFactory(() => 
  new ResendEmailService(process.env.RESEND_API_KEY!)
);

// Bind use cases
container.bind(TYPES.CreateTodoUseCase).toDynamicValue((ctx) => 
  new CreateTodoUseCase(ctx.container.get(TYPES.TodoRepository))
);

// Bind controllers
container.bind(TYPES.TodoController).toDynamicValue((ctx) =>
  new TodoController(
    ctx.container.get(TYPES.CreateTodoUseCase),
    ctx.container.get(TYPES.TodoPresenter)
  )
);

// Bind presenters
container.bind(TYPES.TodoPresenter).toClass(TodoPresenter);

export { container };
```

---

## ✅ Quy Tắc Naming Convention

### File Names
- **Models**: `user.model.ts`, `todo.model.ts`
- **Errors**: `user-errors.ts`, `auth-errors.ts`
- **Use Cases**: `create-todo.use-case.ts`, `sign-in.use-case.ts`
- **Repositories**: `todo.repository.ts` (interface), `drizzle-todo.repository.ts` (implementation)
- **Services**: `email.service.ts` (interface), `resend-email.service.ts` (implementation)
- **Controllers**: `todo.controller.ts`, `auth.controller.ts`
- **Presenters**: `todo.presenter.ts`, `user.presenter.ts`

### Class Names
- **Models**: `User`, `Todo`
- **Errors**: `UserNotFoundError`, `UnauthorizedError`
- **Use Cases**: `CreateTodoUseCase`, `SignInUseCase`
- **Repositories**: `TodoRepository` (interface), `DrizzleTodoRepository` (implementation)
- **Services**: `EmailService` (interface), `ResendEmailService` (implementation)
- **Controllers**: `TodoController`, `AuthController`
- **Presenters**: `TodoPresenter`, `UserPresenter`

---

## 🚫 Các Lỗi Thường Gặp (Anti-patterns)

### ❌ KHÔNG LÀM
```typescript
// ❌ Use case gọi use case khác
export class UpdateTodoUseCase {
  async execute(id: string, title: string) {
    // ❌ KHÔNG làm thế này!
    const todo = await this.getTodoUseCase.execute(id);
    // ...
  }
}

// ❌ Controller implement logic
export class TodoController {
  async createTodo(userId: string, title: string) {
    // ❌ KHÔNG implement logic ở đây!
    const todo = await this.db.insert(todos).values({ userId, title });
    return todo;
  }
}

// ❌ Import implementation trực tiếp ở upper layer
// app/actions/todo.actions.ts
import { DrizzleTodoRepository } from '@/src/infrastructure/repositories/drizzle-todo.repository';
// ❌ KHÔNG import implementation!

// ❌ Bubble up database errors
export class DrizzleTodoRepository {
  async findById(id: string) {
    // ❌ Let database error propagate
    return await db.query.todos.findFirst({ where: eq(todos.id, id) });
  }
}
```

### ✅ LÀM ĐÚNG
```typescript
// ✅ Use case chỉ làm 1 việc
export class UpdateTodoUseCase {
  async execute(id: string, title: string) {
    // ✅ Sử dụng repository trực tiếp
    const todo = await this.todoRepository.findById(id);
    if (!todo) throw new TodoNotFoundError(id);
    
    return await this.todoRepository.update(id, { title });
  }
}

// ✅ Controller orchestrate use cases
export class TodoController {
  async createTodo(userId: string, title: string) {
    // ✅ Validation
    if (!title) throw new Error('Title required');
    
    // ✅ Orchestrate use case
    const todo = await this.createTodoUseCase.execute(userId, title);
    
    // ✅ Present data
    return this.todoPresenter.present(todo);
  }
}

// ✅ Sử dụng DI container
// app/actions/todo.actions.ts
import { container } from '@/di/container';
import { TYPES } from '@/di/types';
const controller = container.get<TodoController>(TYPES.TodoController);

// ✅ Convert database errors
export class DrizzleTodoRepository {
  async findById(id: string) {
    try {
      const todo = await db.query.todos.findFirst({ where: eq(todos.id, id) });
      return todo || null;
    } catch (error) {
      // ✅ Convert to custom error
      throw new DatabaseError('Failed to fetch todo');
    }
  }
}
```

---

## 🛡️ ESLint Boundaries Plugin

**Setup ESLint để enforce dependency rules:**

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals"],
  "plugins": ["boundaries"],
  "settings": {
    "boundaries/elements": [
      {
        "type": "app",
        "pattern": "app/*"
      },
      {
        "type": "interface-adapters",
        "pattern": "src/interface-adapters/*"
      },
      {
        "type": "application",
        "pattern": "src/application/*"
      },
      {
        "type": "infrastructure",
        "pattern": "src/infrastructure/*"
      },
      {
        "type": "entities",
        "pattern": "src/entities/*"
      }
    ],
    "boundaries/rules": [
      {
        "target": "entities",
        "disallow": ["application", "infrastructure", "interface-adapters", "app"]
      },
      {
        "target": "application",
        "disallow": ["infrastructure", "interface-adapters", "app"]
      },
      {
        "target": "infrastructure",
        "disallow": ["interface-adapters", "app"]
      },
      {
        "target": "interface-adapters",
        "disallow": ["app"]
      }
    ]
  }
}
```

---

## 📝 Testing

**Structure tests theo src/ structure:**

```
tests/
└── unit/
    ├── entities/
    │   └── models/
    │       └── user.test.ts
    ├── application/
    │   └── use-cases/
    │       └── create-todo.use-case.test.ts
    ├── infrastructure/
    │   └── repositories/
    │       └── drizzle-todo.repository.test.ts
    └── interface-adapters/
        └── controllers/
            └── todo.controller.test.ts
```

**Ví dụ test use case:**
```typescript
// tests/unit/application/use-cases/create-todo.use-case.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CreateTodoUseCase } from '@/src/application/use-cases/create-todo.use-case';
import type { TodoRepository } from '@/src/application/repositories/todo.repository';

describe('CreateTodoUseCase', () => {
  it('should create a todo', async () => {
    // Mock repository
    const mockRepository: TodoRepository = {
      create: vi.fn().mockResolvedValue({
        id: '123',
        userId: 'user-1',
        title: 'Test todo',
        completed: false,
        createdAt: new Date(),
      }),
      // ... other methods
    };

    const useCase = new CreateTodoUseCase(mockRepository);
    const result = await useCase.execute('user-1', 'Test todo');

    expect(result.title).toBe('Test todo');
    expect(mockRepository.create).toHaveBeenCalledTimes(1);
  });
});
```

---

## 🎓 Khi Nào Nên Dùng Clean Architecture?

### ✅ NÊN DÙNG KHI:
- Dự án có **nhiều features** sẽ được thêm vào
- **Nhiều developers** làm chung dự án
- Dự án có **user base lớn** hoặc dự kiến grow nhanh
- Cần codebase **dễ maintain và test**
- Muốn **thay đổi database/framework** dễ dàng trong tương lai

### ❌ KHÔNG BẮT BUỘC KHI:
- MVP nhỏ, cần validate idea nhanh
- Pet project cá nhân không dự định grow
- Prototype/proof of concept
- Dự án có deadline gấp và không có plan dài hạn

---

## 📚 Tài Liệu Tham Khảo

- [Original Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Onion Architecture](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control)

---

## 🔥 TÓM TẮT NHANH

1. **Entities**: Models + Custom Errors (plain JS/TS)
2. **Application**: Use Cases + Interfaces (business logic)
3. **Infrastructure**: Implementations của Repositories & Services
4. **Interface Adapters**: Controllers (orchestrate) + Presenters (format)
5. **Frameworks & Drivers**: Next.js specific code (pages, components, actions)
6. **Dependency Injection**: Bind interfaces to implementations

**Nguyên tắc vàng**: Lớp trên phụ thuộc lớp dưới, KHÔNG ngược lại!
