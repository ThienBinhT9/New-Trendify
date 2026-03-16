export interface ISaveProps {
  userId: string;
  postId: string;
  createdAt: Date;
}

export interface ISaveCreateInput {
  userId: string;
  postId: string;
}

export class SaveEntity {
  private readonly props: ISaveProps;
  readonly id?: string;

  constructor(props: ISaveProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  get data(): Readonly<ISaveProps> {
    return Object.freeze({ ...this.props });
  }

  get userId(): string {
    return this.props.userId;
  }

  get postId(): string {
    return this.props.postId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isOwnedBy(userId: string): boolean {
    return this.props.userId === userId;
  }

  static create(input: ISaveCreateInput): SaveEntity {
    return new SaveEntity({
      userId: input.userId,
      postId: input.postId,
      createdAt: new Date(),
    });
  }
}
