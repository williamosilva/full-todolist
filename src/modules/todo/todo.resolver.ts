import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { TodoService } from './todo.service';
import { Todo } from './entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';

@Resolver(() => Todo)
export class TodoResolver {
  constructor(private readonly todoService: TodoService) {}

  @Mutation(() => Todo)
  @UseGuards(GqlAuthGuard)
  async createTodo(
    @Args('input') createTodoDto: CreateTodoDto,
    @Context() context,
  ) {
    const payload = {
      completed: false,
      ...createTodoDto,
    };

    return this.todoService.create(payload, context.req.user.id);
  }

  @Query(() => [Todo], { name: 'todos' })
  @UseGuards(GqlAuthGuard)
  async findAll(@Context() context) {
    return this.todoService.findAll(context.req.user.id);
  }

  @Query(() => Todo, { name: 'todo' })
  @UseGuards(GqlAuthGuard)
  async findOne(@Args('id') id: string, @Context() context) {
    return this.todoService.findOne(id, context.req.user.id);
  }

  @Mutation(() => Todo)
  @UseGuards(GqlAuthGuard)
  async updateTodo(
    @Args('id') id: string,
    @Args('input') updateTodoDto: UpdateTodoDto,
    @Context() context,
  ) {
    return this.todoService.update(id, updateTodoDto, context.req.user.id);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteTodo(@Args('id') id: string, @Context() context) {
    await this.todoService.remove(id, context.req.user.id);
    return true;
  }
}
