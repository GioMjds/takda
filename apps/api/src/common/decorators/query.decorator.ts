import { RequestMapping } from '@nestjs/common';

/**
 * Route handler decorator for HTTP QUERY requests.
 *
 * Maps a QUERY request to a route path.
 *
 * @param path String or array of strings representing the path(s) to match.
 */
export function HttpQuery(path?: string | string[]): MethodDecorator {
  return RequestMapping({
    path,
    method: 'QUERY' as any,
  });
}
