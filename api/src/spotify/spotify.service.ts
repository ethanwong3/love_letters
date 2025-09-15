import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SpotifyService {
  private readonly CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
  private readonly REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

  constructor(private readonly httpService: HttpService) {}

  generateAuthUrl(): string {
    const SCOPES = 'user-read-private user-read-email';
    return `https://accounts.spotify.com/authorize?response_type=code&client_id=${this.CLIENT_ID}&scope=${encodeURIComponent(
      SCOPES,
    )}&redirect_uri=${encodeURIComponent(this.REDIRECT_URI || '')}`;
  }

  async exchangeCodeForToken(code: string): Promise<any> {
    const url = 'https://accounts.spotify.com/api/token';
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.REDIRECT_URI || '', // Provide a default value
    });

    const headers = {
      Authorization: `Basic ${Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const response = await firstValueFrom(
      this.httpService.post(url, body.toString(), { headers }),
    );

    return response.data;
  }

  async searchSongs(query: string, accessToken: string): Promise<any> {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const response = await firstValueFrom(this.httpService.get(url, { headers }));
    return response.data;
  }

  async getSongMetadata(id: string, accessToken: string): Promise<any> {
    const url = `https://api.spotify.com/v1/tracks/${id}`;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const response = await firstValueFrom(this.httpService.get(url, { headers }));
    return response.data;
  }
}