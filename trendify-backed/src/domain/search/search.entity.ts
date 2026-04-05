import { ESearchType, ISearchHistoryCreateInput, ISearchHistoryProps } from "./search.type";

// ============================================================================
// ENTITY CLASS
// ============================================================================

export class SearchHistoryEntity {
  private readonly props: ISearchHistoryProps;
  readonly id?: string;

  constructor(props: ISearchHistoryProps, id?: string) {
    this.props = props;
    this.id = id;
  }

  // --------------------------------------------------------------------------
  // Getters
  // --------------------------------------------------------------------------

  get data(): Readonly<ISearchHistoryProps> {
    return Object.freeze({ ...this.props });
  }

  get userId(): string {
    return this.props.userId;
  }

  get keyword(): string {
    return this.props.keyword;
  }

  get searchType(): ESearchType {
    return this.props.searchType;
  }

  get resultCount(): number {
    return this.props.resultCount;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // --------------------------------------------------------------------------
  // Domain Logic
  // --------------------------------------------------------------------------

  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
  }

  /**
   * Update timestamp + resultCount (dùng cho dedup logic)
   * Khi user search cùng keyword trong 1 giờ → chỉ update, không tạo mới
   */
  updateTimestamp(resultCount: number): void {
    this.props.resultCount = resultCount;
    this.props.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // Static Factory
  // --------------------------------------------------------------------------

  static create(input: ISearchHistoryCreateInput): SearchHistoryEntity {
    const now = new Date();

    const props: ISearchHistoryProps = {
      userId: input.userId,
      keyword: input.keyword.toLowerCase().trim(),
      searchType: input.searchType,
      resultCount: input.resultCount,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return new SearchHistoryEntity(props);
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  toSnapshot(): ISearchHistoryProps & { id?: string } {
    return {
      ...this.props,
      id: this.id,
    };
  }
}
