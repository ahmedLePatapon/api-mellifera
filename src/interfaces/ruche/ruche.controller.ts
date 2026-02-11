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
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '@interfaces/common/decorators/current-user.decorator';
import { PaginationQueryDto } from '@interfaces/common/dto/pagination.dto';
import { CreateRucheDto } from './dto/create-ruche.dto';
import { UpdateRucheDto } from './dto/update-ruche.dto';
import { FilterRucheDto } from './dto/filter-ruche.dto';
import {
    CreateRucheCommand,
    UpdateRucheCommand,
    DeleteRucheCommand,
    ListRuchesQuery,
    GetRucheQuery,
} from '@application/ruche';
import { RucheEntity } from '@domain/ruche/entities/ruche.entity';
import { PaginatedResult } from '@shared/types';
import { RucheFilters } from '@domain/ruche/repositories/ruche.repository.interface';

@ApiTags('Ruches')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller()
export class RucheController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }

    @Post('ruchers/:rucherId/ruches')
    @ApiOperation({ summary: 'Créer une ruche dans un rucher' })
    @ApiParam({ name: 'rucherId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 201, description: 'Ruche créée avec succès' })
    @ApiResponse({ status: 400, description: 'Données de validation invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Rucher non trouvé' })
    async create(
        @Param('rucherId', ParseUUIDPipe) rucherId: string,
        @Body() dto: CreateRucheDto,
        @CurrentUser('sub') userId: string,
    ): Promise<RucheEntity> {
        return this.commandBus.execute(
            new CreateRucheCommand(
                dto.nom,
                rucherId,
                userId,
                dto.type,
                dto.statut,
                dto.dateAchat ? new Date(dto.dateAchat) : undefined,
                dto.notes,
            ),
        );
    }

    @Get('ruchers/:rucherId/ruches')
    @ApiOperation({ summary: "Lister les ruches d'un rucher avec pagination et filtrage" })
    @ApiParam({ name: 'rucherId', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Liste paginée des ruches' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async findAll(
        @Param('rucherId', ParseUUIDPipe) rucherId: string,
        @CurrentUser('sub') userId: string,
        @Query() pagination: PaginationQueryDto,
        @Query() filters: FilterRucheDto,
    ): Promise<PaginatedResult<RucheEntity>> {
        const sort = pagination.sortBy
            ? { sortBy: pagination.sortBy, sortOrder: pagination.sortOrder ?? 'desc' as const }
            : undefined;

        const rucheFilters: RucheFilters = {};
        if (filters.statut) rucheFilters.statut = filters.statut;
        if (filters.type) rucheFilters.type = filters.type;

        return this.queryBus.execute(
            new ListRuchesQuery(
                rucherId,
                userId,
                { page: pagination.page, limit: pagination.limit },
                sort,
                Object.keys(rucheFilters).length > 0 ? rucheFilters : undefined,
            ),
        );
    }

    @Get('ruches/:id')
    @ApiOperation({ summary: "Récupérer une ruche par son ID" })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Ruche trouvée' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Ruche non trouvée' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('sub') userId: string,
    ): Promise<RucheEntity> {
        return this.queryBus.execute(new GetRucheQuery(id, userId));
    }

    @Put('ruches/:id')
    @ApiOperation({ summary: 'Modifier une ruche' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Ruche modifiée avec succès' })
    @ApiResponse({ status: 400, description: 'Données de validation invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Ruche non trouvée' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateRucheDto,
        @CurrentUser('sub') userId: string,
    ): Promise<RucheEntity> {
        return this.commandBus.execute(
            new UpdateRucheCommand(
                id,
                userId,
                dto.nom,
                dto.type,
                dto.statut,
                dto.dateAchat !== undefined
                    ? dto.dateAchat
                        ? new Date(dto.dateAchat)
                        : null
                    : undefined,
                dto.notes,
            ),
        );
    }

    @Delete('ruches/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Supprimer une ruche' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 204, description: 'Ruche supprimée avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Ruche non trouvée' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('sub') userId: string,
    ): Promise<void> {
        return this.commandBus.execute(new DeleteRucheCommand(id, userId));
    }
}
