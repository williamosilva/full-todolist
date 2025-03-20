# Todo List API

Este projeto implementa uma API de Todo List utilizando NestJS, com autenticação via Firebase OAuth2 e JWT. Inclui um sistema de CRUD para tarefas e integrações com GraphQL para consultas dinâmicas. O banco de dados é gerenciado pelo Supabase, utilizando PostgreSQL.

## Tecnologias Utilizadas

### Backend
- **NestJS**: Framework Node.js para construção de aplicações server-side eficientes e escaláveis
- **TypeScript**: Linguagem de programação fortemente tipada que compila para JavaScript
- **PostgreSQL**: Sistema de gerenciamento de banco de dados relacional
- **TypeORM**: ORM para TypeScript
- **JWT**: JSON Web Tokens para autenticação segura
- **GraphQL**: Linguagem de consulta para APIs
- **Firebase**: Utilizado para o fluxo de autenticação oAuth2 com o Google
- **Supabase**: Usado para a conexão com o banco Postgresql

### Testes
- **Jest**: Framework de testes para JavaScript
- **Supertest**: Biblioteca para testes de HTTP

## Estrutura do Projeto

```
src/
├── app.module.ts                 # Módulo principal da aplicação
├── common/                      
│   └── guards/                   # Guards para autenticação
│       ├── gql-auth.guard.ts     # Guard para autenticação GraphQL
│       └── jwt-auth.guard.ts     # Guard para autenticação JWT
├── config/                  
│   └── jwt.strategy.ts           # Estratégia JWT
├── main.ts                      
└── modules/                      # Módulos da aplicação
    ├── auth/                     # Módulo de autenticação
    │   ├── auth.controller.ts    # Controlador de autenticação
    │   ├── auth.module.ts        # Módulo de autenticação
    │   ├── auth.service.ts       # Serviço de autenticação
    │   ├── entities/             # Entidades relacionadas à autenticação
    │   │   └── user.entity.ts    # Entidade de usuário
    │   └── tests/                # Testes para o módulo de autenticação
    │       ├── auth.controller.spec.ts
    │       └── auth.service.spec.ts
    ├── firebase/                 # Módulo de integração com Firebase
    │   ├── firebase.module.ts    # Módulo Firebase
    │   └── firebase.service.ts   # Serviço Firebase
    └── todo/                     # Módulo de tarefas
        ├── dto/                  # Data Transfer Objects
        │   ├── create-todo.dto.ts # DTO para criação de tarefas
        │   └── update-todo.dto.ts # DTO para atualização de tarefas
        ├── entities/             # Entidades relacionadas às tarefas
        │   └── todo.entity.ts    # Entidade de tarefa
        ├── tests/                # Testes para o módulo de tarefas
        │   └── todo.controller.spec.ts
        ├── todo.controller.ts    # Controlador de tarefas
        ├── todo.module.ts        # Módulo de tarefas
        ├── todo.resolver.ts      # Resolver GraphQL para tarefas
        └── todo.service.ts       # Serviço de tarefas
```

## Funcionalidades

- **Autenticação**: Login com Firebase e geração de JWT
- **Proteção de Rotas**: Guards para proteger rotas que requerem autenticação
- **CRUD de Tarefas**: Criar, ler, atualizar e deletar tarefas
- **API REST**: Endpoints RESTful para todas as operações
- **API GraphQL**: Resolvers GraphQL para consultas e mutações


## Exemplos de Uso

### Autenticação

**Endpoint:** `POST /auth/login`

```javascript
// Login usando token do Firebase
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'seu-token-firebase',
  }),
});

// Resposta:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Gerenciamento de Tarefas

#### Criar uma nova tarefa

**Endpoint:** `POST /todos`

```javascript
// Requisição
fetch('http://localhost:3000/todos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  body: JSON.stringify({
    title: 'Completar README do projeto',
    description: 'Adicionar seção de exemplos de uso',
  }),
});

// Resposta:
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Completar README do projeto",
  "description": "Adicionar seção de exemplos de uso",
  "completed": false,
  "userId": "user-uuid-123",
  "createdAt": "2025-03-20T14:30:00Z",
  "updatedAt": "2025-03-20T14:30:00Z"
}
```

#### Listar todas as tarefas

**Endpoint:** `GET /todos`

```javascript
// Requisição
fetch('http://localhost:3000/todos', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
});

// Resposta:
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Completar README do projeto",
    "description": "Adicionar seção de exemplos de uso",
    "completed": false,
    "createdAt": "2025-03-20T14:30:00Z",
    "updatedAt": "2025-03-20T14:30:00Z"
  },
  {
    "id": "456e7890-e21d-12d3-b456-426614174001",
    "title": "Implementar autenticação",
    "description": "Usar Firebase OAuth2",
    "completed": true,
    "createdAt": "2025-03-19T10:15:00Z",
    "updatedAt": "2025-03-20T11:45:00Z"
  }
]
```

#### Buscar uma tarefa específica

**Endpoint:** `GET /todos/{id}`

```javascript
// Requisição
fetch('http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
});

// Resposta:
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Completar README do projeto",
  "description": "Adicionar seção de exemplos de uso",
  "completed": false,
  "createdAt": "2025-03-20T14:30:00Z",
  "updatedAt": "2025-03-20T14:30:00Z"
}
```

#### Atualizar uma tarefa

**Endpoint:** `PATCH /todos/{id}`

```javascript
// Requisição
fetch('http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  body: JSON.stringify({
    title: 'README atualizado',
    completed: true,
  }),
});

// Resposta:
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "README atualizado",
  "description": "Adicionar seção de exemplos de uso",
  "completed": true,
  "createdAt": "2025-03-20T14:30:00Z",
  "updatedAt": "2025-03-20T15:45:00Z"
}
```

#### Excluir uma tarefa

**Endpoint:** `DELETE /todos/{id}`

```javascript
// Requisição
fetch('http://localhost:3000/todos/123e4567-e89b-12d3-a456-426614174000', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
});

// Resposta: Status 204 (No Content)
```

## GraphQL


```
### Consultas e Mutações

#### Listar todas as tarefas

**Endpoint:** `POST /graphql`

```javascript
// Consulta
const GET_TODOS = `
  query {
    todos {
      id
      title
      description
      completed
      createdAt
      updatedAt
    }
  }
`;

// Requisição
fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  body: JSON.stringify({
    query: GET_TODOS
  }),
});

// Resposta:
{
  "data": {
    "todos": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Completar README do projeto",
        "description": "Adicionar seção de exemplos de uso",
        "completed": false,
        "createdAt": "2025-03-20T14:30:00Z",
        "updatedAt": "2025-03-20T14:30:00Z"
      },
      {
        "id": "456e7890-e21d-12d3-b456-426614174001",
        "title": "Implementar autenticação",
        "description": "Usar Firebase OAuth2",
        "completed": true,
        "createdAt": "2025-03-19T10:15:00Z",
        "updatedAt": "2025-03-20T11:45:00Z"
      }
    ]
  }
}
```

#### Buscar uma tarefa específica

**Endpoint:** `POST /graphql`

```javascript
// Consulta
const GET_TODO = `
  query($id: ID!) {
    todo(id: $id) {
      id
      title
      description
      completed
      createdAt
      updatedAt
    }
  }
`;

// Requisição
fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  body: JSON.stringify({
    query: GET_TODO,
    variables: {
      id: "123e4567-e89b-12d3-a456-426614174000"
    }
  }),
});

// Resposta:
{
  "data": {
    "todo": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Completar README do projeto",
      "description": "Adicionar seção de exemplos de uso",
      "completed": false,
      "createdAt": "2025-03-20T14:30:00Z",
      "updatedAt": "2025-03-20T14:30:00Z"
    }
  }
}
```

#### Criar uma tarefa

**Endpoint:** `POST /graphql`

```javascript
// Mutação
const CREATE_TODO = `
  mutation($input: CreateTodoDto!) {
    createTodo(createTodoDto: $input) {
      id
      title
      description
      completed
      createdAt
      updatedAt
    }
  }
`;

// Requisição
fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  body: JSON.stringify({
    query: CREATE_TODO,
    variables: {
      input: {
        title: "Aprender GraphQL",
        description: "Estudar queries e mutations do GraphQL"
      }
    }
  }),
});

// Resposta:
{
  "data": {
    "createTodo": {
      "id": "789e0123-e45f-12d3-c789-426614174002",
      "title": "Aprender GraphQL",
      "description": "Estudar queries e mutations do GraphQL",
      "completed": false,
      "createdAt": "2025-03-20T16:00:00Z",
      "updatedAt": "2025-03-20T16:00:00Z"
    }
  }
}
```

#### Atualizar uma tarefa

**Endpoint:** `POST /graphql`

```javascript
// Mutação
const UPDATE_TODO = `
  mutation($id: ID!, $input: UpdateTodoDto!) {
    updateTodo(id: $id, updateTodoDto: $input) {
      id
      title
      description
      completed
      updatedAt
    }
  }
`;

// Requisição
fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  body: JSON.stringify({
    query: UPDATE_TODO,
    variables: {
      id: "789e0123-e45f-12d3-c789-426614174002",
      input: {
        completed: true
      }
    }
  }),
});

// Resposta:
{
  "data": {
    "updateTodo": {
      "id": "789e0123-e45f-12d3-c789-426614174002",
      "title": "Aprender GraphQL",
      "description": "Estudar queries e mutations do GraphQL",
      "completed": true,
      "updatedAt": "2025-03-20T16:30:00Z"
    }
  }
}
```

#### Excluir uma tarefa

**Endpoint:** `POST /graphql`

```javascript
// Mutação
const DELETE_TODO = `
  mutation($id: ID!) {
    removeTodo(id: $id)
  }
`;

// Requisição
fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  body: JSON.stringify({
    query: DELETE_TODO,
    variables: {
      id: "789e0123-e45f-12d3-c789-426614174002"
    }
  }),
});

// Resposta:
{
  "data": {
    "removeTodo": true
  }
}
```

## Boas Práticas Implementadas

- **Clean Code**: Código limpo e bem organizado
- **Arquitetura Modular**: Cada funcionalidade em seu próprio módulo
- **Testes Automatizados**: Cobertura de testes para controladores e serviços
- **Tipagem Forte**: Uso de TypeScript para evitar erros em tempo de execução
- **Segurança**: Implementação de autenticação e autorização

### Autor

William Silva
