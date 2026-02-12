export class DeleteRucheCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
