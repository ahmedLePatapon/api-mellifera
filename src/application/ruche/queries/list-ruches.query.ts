import { PaginationParams, SortParams } from '@shared/types';
import { RucheFilters } from '@domain/ruche/repositories/ruche.repository.interface';

export class ListRuchesQuery {
    constructor(
        public readonly rucherId: string,
        public readonly userId: string,
        public readonly pagination: PaginationParams,
        public readonly sort?: SortParams,
        public readonly filters?: RucheFilters,
    ) { }
}
