import { PaginatedResult, PaginationParams, SortParams } from '../../../shared/types';
import { EtatGeneral } from '../../enums';
import { InspectionEntity } from '../entities/inspection.entity';

export interface InspectionFilters {
    dateFrom?: Date;
    dateTo?: Date;
    etatGeneral?: EtatGeneral;
}

export interface IInspectionRepository {
    findById(id: string): Promise<InspectionEntity | null>;
    findAllByRucheId(
        rucheId: string,
        pagination: PaginationParams,
        sort?: SortParams,
        filters?: InspectionFilters,
    ): Promise<PaginatedResult<InspectionEntity>>;
    create(inspection: InspectionEntity): Promise<InspectionEntity>;
    update(
        id: string,
        inspection: Partial<InspectionEntity>,
    ): Promise<InspectionEntity>;
    delete(id: string): Promise<void>;
}
