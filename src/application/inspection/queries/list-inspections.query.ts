import { PaginationParams, SortParams } from '@shared/types';
import { InspectionFilters } from '@domain/inspection/repositories/inspection.repository.interface';

export class ListInspectionsQuery {
  constructor(
    public readonly rucheId: string,
    public readonly userId: string,
    public readonly pagination: PaginationParams,
    public readonly sort?: SortParams,
    public readonly filters?: InspectionFilters,
  ) {}
}
