import {
  applyDecorators,
  All,
  UseGuards,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

@Injectable()
class QueryMethodGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return request.method === 'QUERY';
  }
}

/**
 * Route handler decorator for HTTP QUERY requests.
 *
 * Maps a QUERY request to a route path.
 *
 * @param path String or array of strings representing the path(s) to match.
 */
export function HttpQuery(path?: string | string[]): MethodDecorator {
  return applyDecorators(All(path), UseGuards(QueryMethodGuard));
}
