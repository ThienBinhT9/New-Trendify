/**
 * Message Producer Interface - Application Layer
 * 
 * Abstraction for publishing events to message queue.
 * Infrastructure layer will implement this interface.
 */
export interface IMessageProducer {
  /**
   * Publish a message to the message queue
   * @param messageType - Type of message (routing key)
   * @param data - Message payload
   * @param options - Optional publish configuration
   */
  publish(
    messageType: string,
    data: any,
    options?: {
      priority?: number;
      expiration?: number;
      persistent?: boolean;
    },
  ): Promise<void>;
}
