# Open-Meteo Provider (Internal)

This provider is service-only. Do not expose it directly through a controller in this change.

## Usage

```ts
import { Injectable } from '@nestjs/common';
import { OpenMeteoService } from './open-meteo.service';

@Injectable()
export class WeatherApplicationService {
  constructor(private readonly openMeteo: OpenMeteoService) {}

  async getDailySummary(latitude: number, longitude: number) {
    const data = await this.openMeteo.getForecast({
      latitude,
      longitude,
      daily: ['temperature_2m_max', 'temperature_2m_min', 'weather_code'],
      timezone: 'auto',
      forecast_days: 3,
    });

    return data.daily;
  }
}
```

## Geocoding Example

```ts
const geo = await this.openMeteo.getGeocoding({
  name: 'Kuching',
  countryCode: 'MY',
  count: 1,
  format: 'json',
});
```