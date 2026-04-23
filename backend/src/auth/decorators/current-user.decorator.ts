import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext) => {
  if (context.getType<'http' | 'graphql'>() === 'http') {
    return context.switchToHttp().getRequest().user;
  }

  const gqlContext = GqlExecutionContext.create(context);
  return gqlContext.getContext().req?.user;
});
