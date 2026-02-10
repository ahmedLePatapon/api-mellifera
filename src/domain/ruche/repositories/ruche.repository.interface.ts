import { PaginatedResult, PaginationParams, SortParams } from '../../../shared/types';
import { TypeRuche, StatutRuche } from '../../enums';
import { RucheEntity } from '../entities/ruche.entity';

export interface RucheFilters {
    statut?: StatutRuche;
    type?: TypeRuche;
}

export interface IRucheRepository {
    findById(id: string): Promise<RucheEntity | null>;
    findAllByRucherId(
        rucherId: string,
        pagination: PaginationParams,
        sort?: SortParams,
        filters?: RucheFilters,
    ): Promise<PaginatedResult<RucheEntity>>;
    create(ruche: RucheEntity): Promise<RucheEntity>;
    update(id: string, ruche: Partial<RucheEntity>): Promise<RucheEntity>;
    delete(id: string): Promise<void>;
}
