import { WsExceptionFilter } from '../ws-exception.filter';
import { WsException } from '@nestjs/websockets';
import { ArgumentsHost } from '@nestjs/common';

describe('WsExceptionFilter', () => {
  let filter: WsExceptionFilter;
  let clientMock: { emit: jest.Mock };
  let hostMock: ArgumentsHost;

  beforeEach(() => {
    filter = new WsExceptionFilter();
    clientMock = { emit: jest.fn() };
    hostMock = {
      switchToWs: () => ({
        getClient: () => clientMock,
        getData: () => ({}),
      }),
    } as unknown as ArgumentsHost;
  });

  it('formats WsException with object error and emits exception frame to client', () => {
    filter.catch(
      new WsException({ code: 'QUEUE_TOKEN_INVALID', message: 'Token is invalid' }),
      hostMock,
    );

    expect(clientMock.emit).toHaveBeenCalledWith('exception', {
      status: 'error',
      code: 'QUEUE_TOKEN_INVALID',
      message: 'Token is invalid',
    });
  });

  it('formats WsException with string error and emits exception frame to client', () => {
    filter.catch(new WsException('Simple error message'), hostMock);

    expect(clientMock.emit).toHaveBeenCalledWith('exception', {
      status: 'error',
      code: 'WS_ERROR',
      message: 'Simple error message',
    });
  });

  it('formats unknown non-WsException as INTERNAL_ERROR and emits exception frame', () => {
    filter.catch(new Error('Uncaught error'), hostMock);

    expect(clientMock.emit).toHaveBeenCalledWith('exception', {
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
  });
});
