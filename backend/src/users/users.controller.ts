import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req: any) {
    return {
      message: 'This is a protected route',
      user: req.user,
    };
  }

  @Get()
  async getAllUsers() {
    const users = await this.usersService.findAll();
    const data = users.map((user) => ({
      ...user,
      roleAlias: user.role?.alias ?? null,
    }));
    return {
      message: 'Users retrieved successfully',
      data,
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(+id);
    if (!user) {
      return {
        message: 'User not found',
        data: null,
      };
    }
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return {
      message: 'User retrieved successfully',
      data: {
        ...userWithoutPassword,
        roleAlias: user.role?.alias ?? null,
      },
    };
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(+id, updateUserDto);
    const { password, ...userWithoutPassword } = user;
    return {
      message: 'User updated successfully',
      data: {
        ...userWithoutPassword,
        roleAlias: user.role?.alias ?? null,
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async softDeleteUser(@Param('id') id: string) {
    await this.usersService.softDelete(+id);
    return {
      message: 'User soft deleted successfully',
    };
  }

  @Patch(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    await this.usersService.resetPassword(+id, resetPasswordDto.newPassword);
    return {
      message: 'Password reset successfully',
    };
  }
}
