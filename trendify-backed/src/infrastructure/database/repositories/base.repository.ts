export abstract class BaseRepository<Entity, Props> {
  protected mapToEntity(doc: any, EntityClass: new (props: Props, id?: string) => Entity): Entity {
    if (!doc) throw new Error("Document not found");

    const { _id, __v, ...rest } = doc as any;

    const createdAt = doc.createdAt ? new Date(doc.createdAt) : null;
    const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : null;

    return new EntityClass({ ...rest, createdAt, updatedAt } as Props, _id.toString());
  }
}
