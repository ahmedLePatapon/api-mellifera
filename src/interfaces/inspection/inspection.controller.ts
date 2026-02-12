import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '@interfaces/common/decorators/current-user.decorator';
import { PaginationQueryDto } from '@interfaces/common/dto/pagination.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { FilterInspectionDto } from './dto/filter-inspection.dto';
import {
  CreateInspectionCommand,
  UpdateInspectionCommand,
  DeleteInspectionCommand,
  ListInspectionsQuery,
  GetInspectionQuery,
} from '@application/inspection';
import { InspectionEntity } from '@domain/inspection/entities/inspection.entity';
import { PaginatedResult } from '@shared/types';
import { InspectionFilters } from '@domain/inspection/repositories/inspection.repository.interface';

@ApiTags('Inspections')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller()
export class InspectionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('ruches/:rucheId/inspections')
  @ApiOperation({ summary: 'Créer une inspection pour une ruche' })
  @ApiParam({ name: 'rucheId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Inspection créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données de validation invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Ruche non trouvée' })
  async create(
    @Param('rucheId', ParseUUIDPipe) rucheId: string,
    @Body() dto: CreateInspectionDto,
    @CurrentUser('sub') userId: string,
  ): Promise<InspectionEntity> {
    return this.commandBus.execute(
      new CreateInspectionCommand(
        new Date(dto.date),
        dto.etatGeneral,
        rucheId,
        userId,
        dto.niveauReserve,
        dto.comportement,
        dto.presenceReine,
        dto.nombreCadres,
        dto.presenceMaladie,
        dto.descriptionMaladie,
        dto.traitementApplique,
        dto.recolteKg,
        dto.notes,
      ),
    );
  }

  @Get('ruches/:rucheId/inspections')
  @ApiOperation({ summary: "Lister les inspections d'une ruche avec pagination et filtrage" })
  @ApiParam({ name: 'rucheId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Liste paginée des inspections' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async findAll(
    @Param('rucheId', ParseUUIDPipe) rucheId: string,
    @CurrentUser('sub') userId: string,
    @Query() pagination: PaginationQueryDto,
    @Query() filterDto: FilterInspectionDto,
  ): Promise<PaginatedResult<InspectionEntity>> {
    const sort = pagination.sortBy
      ? { sortBy: pagination.sortBy, sortOrder: pagination.sortOrder ?? ('desc' as const) }
      : undefined;

    const filters: InspectionFilters = {};
    if (filterDto.dateFrom) filters.dateFrom = new Date(filterDto.dateFrom);
    if (filterDto.dateTo) filters.dateTo = new Date(filterDto.dateTo);
    if (filterDto.etatGeneral) filters.etatGeneral = filterDto.etatGeneral;

    return this.queryBus.execute(
      new ListInspectionsQuery(
        rucheId,
        userId,
        { page: pagination.page, limit: pagination.limit },
        sort,
        Object.keys(filters).length > 0 ? filters : undefined,
      ),
    );
  }

  @Get('inspections/:id')
  @ApiOperation({ summary: 'Récupérer une inspection par son ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Inspection trouvée' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<InspectionEntity> {
    return this.queryBus.execute(new GetInspectionQuery(id, userId));
  }

  @Put('inspections/:id')
  @ApiOperation({ summary: 'Modifier une inspection' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Inspection modifiée avec succès' })
  @ApiResponse({ status: 400, description: 'Données de validation invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInspectionDto,
    @CurrentUser('sub') userId: string,
  ): Promise<InspectionEntity> {
    return this.commandBus.execute(
      new UpdateInspectionCommand(
        id,
        userId,
        dto.date ? new Date(dto.date) : undefined,
        dto.etatGeneral,
        dto.niveauReserve,
        dto.comportement,
        dto.presenceReine,
        dto.nombreCadres,
        dto.presenceMaladie,
        dto.descriptionMaladie,
        dto.traitementApplique,
        dto.recolteKg,
        dto.notes,
      ),
    );
  }

  @Delete('inspections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une inspection' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Inspection supprimée avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Inspection non trouvée' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteInspectionCommand(id, userId));
  }
}
