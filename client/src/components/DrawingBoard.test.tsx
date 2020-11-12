import React from 'react';
import socketMock from '../utils/socket';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import DrawingBoardProvider, { Line } from '../providers/DrawingBoardProvider';
import DrawingBoard from './DrawingBoard';
import { CanvasContextMock } from '../__mocks__/canvasCtx';
import mockServerSocket from '../__mocks__/serverSocket';
import { waitFor } from '../utils';
// eslint-disable-next-line @typescript-eslint/no-explicit-any

jest.mock('../utils/socket');
describe('drawing board', (): void => {
  describe('user', () => {
    beforeEach(() => {
      render(
        <DrawingBoardProvider drawingPermission={true} isGameStarted={true}>
          <DrawingBoard
            width={window.outerWidth}
            height={window.outerHeight}
          ></DrawingBoard>
        </DrawingBoardProvider>
      );
    });
    it('can draw dot', (): void => {
      const canvas = screen.getByTestId('canvas') as HTMLCanvasElement;
      const ctxMock = (canvas.getContext('2d') as unknown) as CanvasContextMock;
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
      fireEvent.mouseUp(canvas, { clientX: 50, clientY: 50 });
      expect(ctxMock.stroke).toBeCalledTimes(1);
      expect(ctxMock.lineTo).toBeCalledTimes(1);
    });
    it('can draw patterns', (): void => {
      const canvas = screen.getByTestId('canvas') as HTMLCanvasElement;
      const ctxMock = (canvas.getContext('2d') as unknown) as CanvasContextMock;
      fireEvent.mouseDown(canvas, { clientX: 70, clientY: 70 });
      fireEvent.mouseMove(canvas, { clientX: 50, clientY: 100 });
      fireEvent.mouseUp(canvas, { clientX: 50, clientY: 50 });
      expect(ctxMock.stroke).toBeCalledTimes(2);
      expect(ctxMock.lineTo).toBeCalledTimes(2);
    });
    it('can finish pattern when stop holding mouse', (): void => {
      const canvas = screen.getByTestId('canvas') as HTMLCanvasElement;
      const ctxMock = (canvas.getContext('2d') as unknown) as CanvasContextMock;
      fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
      fireEvent.mouseUp(canvas, { clientX: 50, clientY: 50 });
      expect(ctxMock.beginPath).toBeCalledTimes(1);
    });
  });
  describe('socket', (): void => {
    beforeEach(() => {
      //@ts-expect-error
      socketMock.listeners = {};
      //@ts-expect-error
      socketMock.on = jest.fn((msg: string, cb: () => void) => {
        //@ts-expect-error
        if (!socketMock.listeners[msg]) {
          //@ts-expect-error
          socketMock.listeners[msg] = [];
        }
        //@ts-expect-error
        socketMock.listeners[msg].push(cb);
      });
      render(
        <DrawingBoardProvider drawingPermission={true} isGameStarted={true}>
          <DrawingBoard
            width={window.outerWidth}
            height={window.outerHeight}
          ></DrawingBoard>
        </DrawingBoardProvider>
      );
    });
    it('draws when socket recieves a message', (): void => {
      const canvas = screen.getByTestId('canvas') as HTMLCanvasElement;
      const ctxMock = (canvas.getContext('2d') as unknown) as CanvasContextMock;
      const serverSocket = mockServerSocket(socketMock);

      const line: Line = {
        brushSize: 10,
        color: '#000000',
        x: 10,
        y: 10,
        isEnding: true,
      };
      serverSocket.emit('lineDraw', line);
      serverSocket.emit('lineDraw', line);
      serverSocket.emit('lineDraw', line);
      expect(ctxMock.stroke).toBeCalledTimes(3);
    });
    it('redraws the drawing state', async (): Promise<void> => {
      const canvas = screen.getByTestId('canvas') as HTMLCanvasElement;
      const ctxMock = (canvas.getContext('2d') as unknown) as CanvasContextMock;
      const serverSocket = mockServerSocket(socketMock);

      const lines: Line[] = new Array(10).fill({
        brushSize: 20,
        color: '#ffffff',
        x: 50,
        y: 20,
        isEnding: false,
      });
      serverSocket.emit('drawingState', lines);
      await waitFor(100);
      expect(ctxMock.stroke).toBeCalledTimes(10);
    });
    it('clears the canvas when round starts', (): void => {
      const canvas = screen.getByTestId('canvas') as HTMLCanvasElement;
      const ctxMock = (canvas.getContext('2d') as unknown) as CanvasContextMock;
      const serverSocket = mockServerSocket(socketMock);
      serverSocket.emit('roundStart', 1);
      expect(ctxMock.clearRect).toBeCalledTimes(1);
    });
  });
});
afterEach(cleanup);