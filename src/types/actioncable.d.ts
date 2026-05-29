declare module "@rails/actioncable" {
  interface Consumer {
    subscriptions: Subscriptions;
    disconnect(): void;
  }

  interface Subscriptions {
    create(
      channelName: string | object,
      mixin?: Partial<CreateMixin>
    ): Subscription;
  }

  interface CreateMixin {
    connected(): void;
    disconnected(): void;
    received(data: unknown): void;
    rejected(): void;
  }

  interface Subscription {
    perform(action: string, data?: Record<string, unknown>): void;
    send(data: Record<string, unknown>): boolean;
    unsubscribe(): void;
  }

  function createConsumer(url?: string): Consumer;
}
