import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { Role } from '../users/entities/role.entity';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get(':alias')
  findOne(@Param('alias') alias: string): Promise<Role> {
    return this.rolesService.findOne(alias);
  }

  @Patch(':alias')
  update(
    @Param('alias') alias: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    return this.rolesService.update(alias, updateRoleDto);
  }

  @Delete(':alias')
  remove(@Param('alias') alias: string): Promise<{ message: string }> {
    return this.rolesService.remove(alias);
  }
}
