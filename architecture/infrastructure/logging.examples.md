# Log: exemplos

## VendorLoggerConfig

```ts
// part of the library's injectable config
@Injectable()
export class VendorLoggerConfig {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('Vendor');
  }

  build(): VendorLoggerOptions {
    const options: VendorLoggerOptions = {
      disableColors: true,
      level: 'debug',
      log: (level, message, ...args) => {
        if (args.length === 0) {
          this.logger[level](message);
          return;
        }
        this.logger[level]({ args }, message);
      },
    };
    return options;
  }
}
```
