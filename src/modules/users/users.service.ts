import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  findAll() {
    // TODO: Implement find all users
    return [];
  }

  findOne(id: string) {
    // TODO: Implement find one user by id
    return { id };
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    // TODO: Implement update user
    return { id, ...updateUserDto };
  }

  remove(id: string) {
    // TODO: Implement remove user
    return { id };
  }
}
