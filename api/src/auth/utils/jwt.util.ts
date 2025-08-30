import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtUtil {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(payload: object, secret: string, expiresIn: string): string {
    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  /*verifyToken(token: string, secret: string): object | string {
    return this.jwtService.verify(token, { secret });
  }*/
}