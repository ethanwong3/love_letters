import { Controller, Get, Query, Res, Req, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { SpotifyService } from './spotify.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('letter')
@UseGuards(JwtAuthGuard)
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('login')
  login(@Res() res: Response) {
    const authUrl = this.spotifyService.generateAuthUrl();
    res.redirect(authUrl);
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Res() res: Response) {
    try {
      const tokenData = await this.spotifyService.exchangeCodeForToken(code);
      res.json(tokenData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to exchange code for token' });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchSongs(@Query('query') query: string, @Req() req) {
    const accessToken = req.user.spotifyAccessToken; // Assume token is stored in user object
    return this.spotifyService.searchSongs(query, accessToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('song')
  async getSongMetadata(@Query('id') id: string, @Req() req) {
    const accessToken = req.user.spotifyAccessToken;
    return this.spotifyService.getSongMetadata(id, accessToken);
  }
}