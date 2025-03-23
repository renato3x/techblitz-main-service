import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  hash(password: string) {
    const hash = bcrypt.hashSync(password, 10);
    return hash;
  }
}
