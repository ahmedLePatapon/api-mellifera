export class DeleteInspectionCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
