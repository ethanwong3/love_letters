import { Controller, Get, Query, Res, Req, UseGuards, Headers, Options } from '@nestjs/common';
import type { Response } from 'express';
import { SpotifyService } from './spotify.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Logger } from '@nestjs/common';

@Controller('spotify')
export class SpotifyController {
  private readonly logger = new Logger(SpotifyController.name);
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('login')
  login(@Res() res: Response) {
    const authUrl = this.spotifyService.generateAuthUrl();
    res.redirect(authUrl);
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('error') error: string, @Res() res: Response) {
    console.log("Spotify callback hit with code:", code);
    console.log("Spotify callback error parameter:", error);
    
    if (error) {
      console.error("Spotify authorization error:", error);
      res.send(`
        <script>
          if (window.opener) {
            window.opener.postMessage({ error: "${error}" }, "*");
            window.close();
          } else {
            document.body.innerText = "Authorization failed: ${error}";
          }
        </script>
      `);
      return;
    }

    if (!code) {
      console.error("No authorization code received");
      res.send(`
        <script>
          if (window.opener) {
            window.opener.postMessage({ error: "No authorization code received" }, "*");
            window.close();
          } else {
            document.body.innerText = "Authorization failed: No code received";
          }
        </script>
      `);
      return;
    }

    try {
      const tokenData = await this.spotifyService.exchangeCodeForToken(code);
      console.log("Token exchange successful, sending to frontend:", {
        hasAccessToken: !!tokenData.access_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        hasRefreshToken: !!tokenData.refresh_token
      });
      
      // Make sure we're sending the access_token field (not accessToken)
      res.send(`
        <script>
          if (window.opener) {
            window.opener.postMessage({
              access_token: "${tokenData.access_token}",
              token_type: "${tokenData.token_type || 'Bearer'}",
              expires_in: ${tokenData.expires_in || 3600},
              refresh_token: "${tokenData.refresh_token || ''}",
              scope: "${tokenData.scope || ''}"
            }, "*");
            window.close();
          } else {
            document.body.innerText = "Success! You can close this tab.";
          }
        </script>
      `);
    } catch (error) {
      console.error("Spotify callback error:", error);
      res.send(`
        <script>
          if (window.opener) {
            window.opener.postMessage({ error: "Token exchange failed: ${error.message}" }, "*");
            window.close();
          } else {
            document.body.innerText = "Token exchange failed. Please try again.";
          }
        </script>
      `);
    }
  }

  @Options('search')
  searchOptions() {
    return {};
  }

  //@UseGuards(JwtAuthGuard)
  @Get('search')
  async searchSongs(
    @Query('query') query: string, 
    @Headers('spotify-access-token') spotifyToken: string,
    @Req() req
  ) {
    console.log('🔍 SEARCH ENDPOINT HIT - Query:', query); // Add this line
    this.logger.debug(`Received search request with query: ${query}`);
    
    // Try to get token from header first, then from user object
    const accessToken = spotifyToken || req.user?.spotifyAccessToken;
    
    if (!accessToken) {
      this.logger.error('Spotify access token is missing from both header and user object');
      throw new Error('Spotify access token is required');
    }

    try {
      const results = await this.spotifyService.searchSongs(query, accessToken);
      this.logger.debug(`Spotify API response received`);
      return results;
    } catch (error) {
      this.logger.error(`Error during Spotify search: ${error.message}`, error.stack);
      throw new Error('Failed to search songs on Spotify');
    }
  }

  @Options('song')  
  songOptions() {
    return {};
  }

  //@UseGuards(JwtAuthGuard)
  @Get('song')
  async getSongMetadata(
    @Query('id') id: string, 
    @Headers('spotify-access-token') spotifyToken: string,
    @Req() req
  ) {
    this.logger.debug(`Received song metadata request for ID: ${id}`);
    
    // Try to get token from header first, then from user object
    const accessToken = spotifyToken || req.user?.spotifyAccessToken;
    
    if (!accessToken) {
      this.logger.error('Spotify access token is missing from both header and user object');
      throw new Error('Spotify access token is required');
    }

    try {
      const result = await this.spotifyService.getSongMetadata(id, accessToken);
      this.logger.debug(`Song metadata retrieved successfully for ID: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error getting song metadata: ${error.message}`, error.stack);
      throw new Error('Failed to get song metadata from Spotify');
    }
  }

  @Get('test')
  test() {
    console.log('TEST ENDPOINT HIT');
    return { message: 'Spotify controller is working', timestamp: new Date().toISOString() };
  }
}