import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private readonly CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  private readonly REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

  constructor(private readonly httpService: HttpService) {
    // Log configuration issues
    if (!this.CLIENT_ID) {
      this.logger.error('SPOTIFY_CLIENT_ID environment variable is not set');
    }
    if (!this.CLIENT_SECRET) {
      this.logger.error('SPOTIFY_CLIENT_SECRET environment variable is not set');
    }
    if (!this.REDIRECT_URI) {
      this.logger.error('SPOTIFY_REDIRECT_URI environment variable is not set');
    }
  }

  generateAuthUrl(): string {
    // Updated scopes to include Web Playback SDK permissions
    const SCOPES = [
      'user-read-private',
      'user-read-email',
      'streaming',              // Required for Web Playback SDK
      'user-read-playback-state', // Required to read player state
      'user-modify-playback-state', // Required to control playback
      'user-read-currently-playing' // Optional: to read what's currently playing
    ].join(' ');

    return `https://accounts.spotify.com/authorize?response_type=code&client_id=${this.CLIENT_ID}&scope=${encodeURIComponent(
      SCOPES,
    )}&redirect_uri=${encodeURIComponent(this.REDIRECT_URI || '')}`;
  }

  async exchangeCodeForToken(code: string): Promise<any> {
    console.log('🔄 exchangeCodeForToken called with code:', code ? 'received' : 'MISSING');
    console.log('🔧 Environment check:');
    console.log('  - CLIENT_ID exists:', !!this.CLIENT_ID);
    console.log('  - CLIENT_SECRET exists:', !!this.CLIENT_SECRET);
    console.log('  - REDIRECT_URI:', this.REDIRECT_URI);

    if (!code) {
      throw new Error('Authorization code is required');
    }

    const url = 'https://accounts.spotify.com/api/token';
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,  // Make sure code is properly passed
      redirect_uri: this.REDIRECT_URI || '',
    });

    console.log('📤 Request body:', body.toString());

    const headers = {
      Authorization: `Basic ${Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body.toString(), { headers }),
      );
      console.log('✅ Token exchange successful');
      return response.data;
    } catch (error) {
      console.error('❌ Token exchange failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const url = 'https://accounts.spotify.com/api/token';
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const headers = {
      Authorization: `Basic ${Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body.toString(), { headers }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new Error('Failed to refresh Spotify token');
    }
  }

  async searchSongs(query: string, accessToken: string): Promise<any> {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`;
    const headers = { Authorization: `Bearer ${accessToken}` };

    this.logger.debug(`Searching Spotify with query: ${query}`);

    try {
      const response = await firstValueFrom(this.httpService.get(url, { headers }));
      this.logger.debug(`Spotify search successful, found ${response.data.tracks?.items?.length || 0} tracks`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(`Spotify API error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
        
        if (error.response?.status === 401) {
          throw new Error('Spotify access token is invalid or expired');
        }
        if (error.response?.status === 403) {
          throw new Error('Spotify access forbidden - check token permissions');
        }
        if (error.response?.status === 429) {
          throw new Error('Spotify API rate limit exceeded');
        }
      }
      
      this.logger.error(`Spotify search failed: ${error.message}`);
      throw new Error('Spotify API request failed');
    }
  }

  async getSongMetadata(id: string, accessToken: string): Promise<any> {
    const url = `https://api.spotify.com/v1/tracks/${id}`;
    const headers = { Authorization: `Bearer ${accessToken}` };
    
    try {
      const response = await firstValueFrom(this.httpService.get(url, { headers }));
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(`Spotify API error getting track metadata: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
      }
      throw new Error('Failed to get song metadata from Spotify');
    }
  }

  async getUserProfile(accessToken: string): Promise<any> {
    const url = 'https://api.spotify.com/v1/me';
    const headers = { Authorization: `Bearer ${accessToken}` };
    
    try {
      const response = await firstValueFrom(this.httpService.get(url, { headers }));
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(`Spotify API error getting user profile: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
      }
      throw new Error('Failed to get user profile from Spotify');
    }
  }
}