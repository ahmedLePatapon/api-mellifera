export class DeleteRucherCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
