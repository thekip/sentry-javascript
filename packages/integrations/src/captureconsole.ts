import { EventProcessor, Hub, Integration } from '@sentry/types';
import { fill, getGlobalObject, safeJoin, severityFromString } from '@sentry/utils';

const global = getGlobalObject<Window | NodeJS.Global>();

/** Send Console API calls as Sentry Events */
export class CaptureConsole implements Integration {
  /**
   * @inheritDoc
   */
  public static id: string = 'CaptureConsole';

  /**
   * @inheritDoc
   */
  public name: string = CaptureConsole.id;

  /**
   * @inheritDoc
   */
  private readonly _levels: string[] = ['log', 'info', 'warn', 'error', 'debug', 'assert'];

  /**
   * @inheritDoc
   */
  public constructor(options: { levels?: string[] } = {}) {
    if (options.levels) {
      this._levels = options.levels;
    }
  }

  /**
   * @inheritDoc
   */
  public setupOnce(_: (callback: EventProcessor) => void, getCurrentHub: () => Hub): void {
    if (!('console' in global)) {
      return;
    }

    this._levels.forEach((level: string) => {
      if (!(level in global.console)) {
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fill(global.console, level, (originalConsoleMethod: () => any) => (...args: any[]): void => {
        const hub = getCurrentHub();

        if (hub.getIntegration(CaptureConsole)) {
          hub.withScope(scope => {
            scope.setLevel(severityFromString(level));
            scope.setExtra('arguments', args);
            scope.addEventProcessor(event => {
              event.logger = 'console';
              return event;
            });

            let message = safeJoin(args, ' ');
            if (level === 'assert') {
              if (args[0] === false) {
                message = `Assertion failed: ${safeJoin(args.slice(1), ' ') || 'console.assert'}`;
                scope.setExtra('arguments', args.slice(1));
                hub.captureMessage(message);
              }
            } else if (level === 'error' && args[0] instanceof Error) {
              hub.captureException(args[0]);
            } else {
              hub.captureMessage(message);
            }
          });
        }

        // this fails for some browsers. :(
        if (originalConsoleMethod) {
          originalConsoleMethod.call(global.console, args);
        }
      });
    });
  }
}
