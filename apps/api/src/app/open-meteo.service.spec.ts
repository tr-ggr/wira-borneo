import { OpenMeteoService } from './open-meteo.service';
import { OpenMeteoProviderError } from './open-meteo.types';

describe('OpenMeteoService', () => {
  let service: OpenMeteoService;

  beforeEach(() => {
    service = new OpenMeteoService();
    jest.restoreAllMocks();
  });

  it('serializes forecast query params and returns JSON payload', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          latitude: 1,
          longitude: 110,
          generationtime_ms: 1,
          utc_offset_seconds: 0,
          timezone: 'UTC',
          timezone_abbreviation: 'UTC',
          elevation: 12,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await service.getForecast({
      latitude: 1,
      longitude: 110,
      hourly: ['temperature_2m', 'rain'],
      timezone: 'auto',
      forecast_days: 3,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const requestedUrl = String(fetchSpy.mock.calls[0][0]);
    expect(requestedUrl).toContain('https://api.open-meteo.com/v1/forecast?');
    expect(requestedUrl).toContain('latitude=1');
    expect(requestedUrl).toContain('longitude=110');
    expect(requestedUrl).toContain('hourly=temperature_2m%2Crain');
    expect(requestedUrl).toContain('timezone=auto');
    expect(requestedUrl).toContain('forecast_days=3');
  });

  it('maps geocoding params into expected upstream query keys', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ generationtime_ms: 1, results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await service.getGeocoding({
      name: 'Kuching',
      count: 5,
      countryCode: 'MY',
      language: 'en',
      format: 'json',
    });

    const requestedUrl = String(fetchSpy.mock.calls[0][0]);
    expect(requestedUrl).toContain(
      'https://geocoding-api.open-meteo.com/v1/search?',
    );
    expect(requestedUrl).toContain('name=Kuching');
    expect(requestedUrl).toContain('count=5');
    expect(requestedUrl).toContain('country_code=MY');
    expect(requestedUrl).toContain('language=en');
    expect(requestedUrl).toContain('format=json');
  });

  it('throws provider error with operation context on non-ok responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ reason: 'bad request' }), {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(
      service.getForecast({ latitude: 1, longitude: 110 }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<OpenMeteoProviderError>>({
        name: 'OpenMeteoProviderError',
        operation: 'forecast',
        status: 400,
      }),
    );
  });
});