import { PaginatedResult, PaginationParams, SortParams } from '../../../shared/types';
import { RucherEntity } from '../entities/rucher.entity';

export interface RucherFilters {
  search?: string;
}

export interface IRucherRepository {
  findById(id: string): Promise<RucherEntity | null>;
  findAllByUserId(
    userId: string,
    pagination: PaginationParams,
    sort?: SortParams,
    filters?: RucherFilters,
  ): Promise<PaginatedResult<RucherEntity>>;
  create(rucher: RucherEntity): Promise<RucherEntity>;
  update(id: string, rucher: Partial<RucherEntity>): Promise<RucherEntity>;
  delete(id: string): Promise<void>;
}
