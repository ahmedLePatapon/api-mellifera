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
import { CreateRucherDto } from './dto/create-rucher.dto';
import { UpdateRucherDto } from './dto/update-rucher.dto';
import {
    CreateRucherCommand,
    UpdateRucherCommand,
    DeleteRucherCommand,
    ListRuchersQuery,
    GetRucherQuery,
} from '@application/rucher';
import { RucherEntity } from '@domain/rucher/entities/rucher.entity';
import { PaginatedResult } from '@shared/types';

@ApiTags('Ruchers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('ruchers')
export class RucherController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Créer un nouveau rucher' })
    @ApiResponse({ status: 201, description: 'Rucher créé avec succès' })
    @ApiResponse({ status: 400, description: 'Données de validation invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async create(
        @Body() dto: CreateRucherDto,
        @CurrentUser('sub') userId: string,
    ): Promise<RucherEntity> {
        return this.commandBus.execute(
            new CreateRucherCommand(
                dto.nom,
                userId,
                dto.adresse,
                dto.latitude,
                dto.longitude,
                dto.description,
            ),
        );
    }

    @Get()
    @ApiOperation({ summary: 'Lister ses ruchers avec pagination et recherche' })
    @ApiResponse({ status: 200, description: 'Liste paginée des ruchers' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    async findAll(
        @CurrentUser('sub') userId: string,
        @Query() pagination: PaginationQueryDto,
        @Query('search') search?: string,
    ): Promise<PaginatedResult<RucherEntity>> {
        const sort = pagination.sortBy
            ? { sortBy: pagination.sortBy, sortOrder: pagination.sortOrder ?? 'desc' as const }
            : undefined;

        const filters = search ? { search } : undefined;

        return this.queryBus.execute(
            new ListRuchersQuery(
                userId,
                { page: pagination.page, limit: pagination.limit },
                sort,
                filters,
            ),
        );
    }

    @Get(':id')
    @ApiOperation({ summary: "Récupérer un rucher par son ID" })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Rucher trouvé' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Rucher non trouvé' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('sub') userId: string,
    ): Promise<RucherEntity> {
        return this.queryBus.execute(new GetRucherQuery(id, userId));
    }

    @Put(':id')
    @ApiOperation({ summary: 'Modifier un rucher' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Rucher modifié avec succès' })
    @ApiResponse({ status: 400, description: 'Données de validation invalides' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Rucher non trouvé' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateRucherDto,
        @CurrentUser('sub') userId: string,
    ): Promise<RucherEntity> {
        return this.commandBus.execute(
            new UpdateRucherCommand(
                id,
                userId,
                dto.nom,
                dto.adresse,
                dto.latitude,
                dto.longitude,
                dto.description,
            ),
        );
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Supprimer un rucher' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 204, description: 'Rucher supprimé avec succès' })
    @ApiResponse({ status: 401, description: 'Non authentifié' })
    @ApiResponse({ status: 404, description: 'Rucher non trouvé' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser('sub') userId: string,
    ): Promise<void> {
        return this.commandBus.execute(new DeleteRucherCommand(id, userId));
    }
}
