import { PaginationParams, SortParams } from '@shared/types';
import { RucherFilters } from '@domain/rucher/repositories/rucher.repository.interface';

export class ListRuchersQuery {
  constructor(
    public readonly userId: string,
    public readonly pagination: PaginationParams,
    public readonly sort?: SortParams,
    public readonly filters?: RucherFilters,
  ) {}
}
