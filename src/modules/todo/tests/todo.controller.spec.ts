import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TodoController } from '../todo.controller';
import { TodoService } from '../todo.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateTodoDto } from '../dto/create-todo.dto';
import { UpdateTodoDto } from '../dto/update-todo.dto';

describe('TodoController (e2e)', () => {
  let app: INestApplication;
  let todoService: TodoService;

  const mockUser = {
    id: 'user123',
    email: 'user@example.com',
  };

  const mockTodo = {
    id: 'todo123',
    title: 'Test Todo',
    description: 'Test Description',
    completed: false,
    userId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [
        {
          provide: TodoService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockTodo),
            findAll: jest.fn().mockResolvedValue([mockTodo]),
            findOne: jest.fn().mockResolvedValue(mockTodo),
            update: jest.fn().mockResolvedValue(mockTodo),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    await app.init();
    todoService = module.get<TodoService>(TodoService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /todos', () => {
    it('should create a todo (201)', async () => {
      const createDto: CreateTodoDto = {
        title: 'New Todo',
        description: 'New Description',
      };

      await request(app.getHttpServer())
        .post('/todos')
        .send(createDto)
        .expect(201)
        .expect(JSON.parse(JSON.stringify(mockTodo)));
    });
  });

  describe('GET /todos', () => {
    it('should get all todos (200)', async () => {
      await request(app.getHttpServer())
        .get('/todos')
        .expect(200)
        .expect(JSON.parse(JSON.stringify([mockTodo])));
    });
  });

  describe('GET /todos/:id', () => {
    it('should get a single todo (200)', async () => {
      await request(app.getHttpServer())
        .get(`/todos/${mockTodo.id}`)
        .expect(200)
        .expect(JSON.parse(JSON.stringify(mockTodo)));
    });
  });

  describe('PATCH /todos/:id', () => {
    it('should update a todo (200)', async () => {
      const updateDto: UpdateTodoDto = {
        title: 'Updated Todo',
        completed: true,
      };

      await request(app.getHttpServer())
        .patch(`/todos/${mockTodo.id}`)
        .send(updateDto)
        .expect(200)
        .expect(JSON.parse(JSON.stringify(mockTodo)));
    });
  });

  describe('DELETE /todos/:id', () => {
    it('should delete a todo (204)', async () => {
      const removeSpy = jest.spyOn(todoService, 'remove');

      await request(app.getHttpServer())
        .delete(`/todos/${mockTodo.id}`)
        .expect(204);

      expect(removeSpy).toHaveBeenCalledWith(mockTodo.id, mockUser.id);
    });
  });
});
