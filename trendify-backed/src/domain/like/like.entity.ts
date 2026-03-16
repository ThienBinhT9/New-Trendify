export interface ILikeProps {
  userId: string;
  postId: string;
  createdAt: Date;
}

export interface ILikeCreateInput {
  userId: string;
  postId: string;
}

export class LikeEntity {
  private readonly props: ILikeProps;
  readonly id?: string;

  constructor(props: ILikeProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  get data(): Readonly<ILikeProps> {
    return Object.freeze({ ...this.props });
  }

  get userId(): string {
    return this.props.userId;
  }

  get postId(): string {
    return this.props.postId;
  }

  isOwnedBy(userId: string): boolean {
    return this.props.userId === userId;
  }

  static create(input: ILikeCreateInput): LikeEntity {
    return new LikeEntity({
      userId: input.userId,
      postId: input.postId,
      createdAt: new Date(),
    });
  }
}
