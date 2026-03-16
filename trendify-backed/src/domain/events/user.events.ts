export interface DomainEvent {
  eventId: string;
  eventType: string;
  occurredOn: Date;
  aggregateId: string;
}

export interface ProfileUpdatedEvent extends DomainEvent {
  eventType: "user.profile.updated";
  aggregateId: string; // userId
  data: {
    userId: string;
    updatedFields: string[];
  };
}

export interface SettingsChangedEvent extends DomainEvent {
  eventType: "user.settings.changed";
  aggregateId: string; // userId
  data: {
    userId: string;
    changedFields: string[];
  };
}

export type UserDomainEvent = ProfileUpdatedEvent | SettingsChangedEvent;

// Factory functions
export class UserEventFactory {
  static profileUpdated(userId: string, updatedFields: string[]): ProfileUpdatedEvent {
    return {
      eventId: crypto.randomUUID(),
      eventType: "user.profile.updated",
      occurredOn: new Date(),
      aggregateId: userId,
      data: {
        userId,
        updatedFields,
      },
    };
  }

  static settingsChanged(userId: string, changedFields: string[]): SettingsChangedEvent {
    return {
      eventId: crypto.randomUUID(),
      eventType: "user.settings.changed",
      occurredOn: new Date(),
      aggregateId: userId,
      data: {
        userId,
        changedFields,
      },
    };
  }
}
